import type {
  CloudFrontRequestEvent,
  CloudFrontRequestResult,
} from "aws-lambda";
import { Client } from "pg";

// Hardcode the database connection details
const dbConfig = {
  host: "awsstack-postgresinstance19cdd68a-kaugnb8fmy74.ch4ias0oqqnx.us-east-1.rds.amazonaws.com",
  port: 5432,
  database: "mydatabase",
  user: "oppfy_db",
  password: "bF5BvbGii-e2ixpj",
};

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
      return request;
    } else {
      console.log("private uri", `/private${uri}`);
      request.uri = `/private${uri}`;
      return request;
    }
  } catch (error) {
    console.error("Error:", error);
    return { status: "500", statusDescription: "Internal Server Error" };
  }
}

async function checkIfPublic(postKey: string): Promise<boolean> {
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
