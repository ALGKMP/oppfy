
import { S3Client } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as migration from "./schema/migration";

export const schema = { ...migration };

export { mySqlTable as tableCreator } from "./schema/_table";

export * from "drizzle-orm";

const connection = await mysql.createConnection({
  port: Number(process.env.DATABASE_PORT),
  host: process.env.DATABASE_ENDPOINT,
  user: process.env.DATABASE_USERNAME,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
});

export const db = drizzle(connection, {
  logger: true,
  schema,
  mode: "default"
});

// const test = db.query.user.findFirst({ where: eq(migration.user.id, "sdt") });

const globalForS3 = globalThis as { s3?: S3Client };

export const s3 =
  globalForS3.s3 ??
  new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
