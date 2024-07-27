import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import type {
  Callback,
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
  Context,
} from "aws-lambda";
import { Client } from "pg";

interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const ssmClient = new SSMClient({ region: "us-east-1" });

async function getDbConfig() {
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
}

export async function handler(
  event: CloudFrontRequestEvent,
): Promise<CloudFrontRequestResult> {
  const request = event.Records[0]?.cf.request;
  if (request === undefined) {
    return { status: "404", statusDescription: "Not Found" };
  }

  const uri = request.uri;
  console.log("uri", uri);

  try {
    const postId = uri.split("/").pop()?.split(".")[0]; // Extract postId from URI
    console.log("postId", postId);

    if (postId === undefined) {
      return { status: "404", statusDescription: "Not Found" };
    }

    const isPublic = await checkIfPublic(postId);
    console.log("isPublic", isPublic);

    if (isPublic) {
      console.log("Access Granted");
      return request;
    } else {
      console.log("Access Denied");
      return { status: "403", statusDescription: "Access Denied" };
    }
  } catch (error) {
    console.error("Error:", error);
    return { status: "500", statusDescription: "Internal Server Error" };
  }
}

async function checkIfPublic(postKey: string): Promise<boolean> {
  const dbConfig = await getDbConfig();
  const client = new Client(dbConfig);
  await client.connect();
  try {
    console.log("Checking post key:", postKey);
    const query = `
      SELECT u."privacy_setting"
      FROM "post" p
      JOIN "user" u ON p."author" = u."id"
      WHERE p."key" = $1
    `;
    const result = await client.query(query, [`posts/${postKey}`]);
    console.log("Query result:", result.rows);
    if (result.rows.length > 0) {
      return result.rows[0].privacy_setting === "public";
    }
    return false;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  } finally {
    await client.end();
  }
}
