import { S3Client } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import Mux from "@mux/mux-node";

// import * as migration from "@acme/db/src/schema/migration";
import * as migration from "./src/schema/schema";

export const schema = { ...migration };

// export { mySqlTable as tableCreator } from "@acme/db/src/schema/_table";
export { mySqlTable as tableCreator } from "./src/schema/_table";

export * from "drizzle-orm";

export const connection = await mysql.createConnection({
  port: Number(process.env.DATABASE_PORT),
  host: process.env.DATABASE_ENDPOINT,
  user: process.env.DATABASE_USERNAME,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
});

export const db = drizzle(connection, {
  logger: true,
  schema,
  mode: "default",
});

export const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!, // This is the default and can be omitted
  tokenSecret: process.env.MUX_TOKEN_SECRET!, // This is the default and can be omitted
});
