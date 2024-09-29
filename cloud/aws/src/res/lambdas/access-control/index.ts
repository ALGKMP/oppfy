import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import type {
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
} from "aws-lambda";
import { Client } from "pg";

interface Post {
  privacy_setting: string;
}

interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const ssmClient = new SSMClient({ region: "us-east-1" });

const isPost = (row: unknown): row is Post => {
  return (
    typeof row === "object" &&
    row !== null &&
    "privacy_setting" in row &&
    typeof row.privacy_setting === "string"
  );
};

const getDbConfig = async () => {
  const parameterName = "/oppfy/db-config";
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });

  try {
    const response = await ssmClient.send(command);
    return JSON.parse(response.Parameter?.Value ?? "{}") as DbConfig;
  } catch (error) {
    console.error("Error fetching DB config:", error);
    throw error;
  }
};

const checkIfPublic = async (postKey: string): Promise<boolean> => {
  const dbConfig = await getDbConfig();

  const client = new Client(dbConfig);
  await client.connect();
  console.log("postKey", postKey);

  try {
    const query = `
      SELECT u."privacy_setting"
      FROM "post" p
      JOIN "user" u ON p."recipient_id" = u."id"
      WHERE p."key" = $1
    `;

    const result = await client.query(query, [`${postKey}`]);
    const row = result.rows[0] as unknown;

    if (!isPost(row)) {
      return false;
    }

    return row.privacy_setting === "public";
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    await client.end();
  }
};

const handler = async (
  event: CloudFrontRequestEvent,
): Promise<CloudFrontRequestResult> => {
  const request = event.Records[0]?.cf.request;
  if (request === undefined) {
    return { status: "404", statusDescription: "Not Found" };
  }

  const uri = request.uri.slice(1);

  let isPublic = false;

  try {
    isPublic = await checkIfPublic(uri);
  } catch (error) {
    console.error("Error:", error);
    return { status: "500", statusDescription: "Internal Server Error" };
  }

  return isPublic
    ? request
    : { status: "403", statusDescription: "Access Denied" };
};

export { handler };
