import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { fromIni } from '@aws-sdk/credential-providers';
import { S3Client } from "@aws-sdk/client-s3";

import * as auth from "./schema/auth";
import * as post from "./schema/post";
import * as migration from "./schema/migration";

export const schema = { ...auth, ...post, ...migration };

export { mySqlTable as tableCreator } from "./schema/_table";

export * from "drizzle-orm";


const rdsClient = new RDSDataClient({
    credentials: fromIni({ profile: process.env.PROFILE }),
    region: 'us-east-1',
});

export const db = drizzle(rdsClient, {
  database: process.env.DATABASE!,
  secretArn: process.env.SECRET_ARN!,
  resourceArn: process.env.RESOURCE_ARN!,
  logger: true,
});

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