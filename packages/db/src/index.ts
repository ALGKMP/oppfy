import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { fromIni } from '@aws-sdk/credential-providers';

import * as auth from "./schema/auth";
import * as post from "./schema/post";

export const schema = { ...auth, ...post };

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
});