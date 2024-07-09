import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";

import { env } from "@oppfy/env";

import * as migration from "./src/schema/schema";

export const schema = { ...migration };

export { mySqlTable as tableCreator } from "./src/schema/_table";

export * from "drizzle-orm";

export const connection = await mysql.createConnection({
  port: Number(env.DATABASE_PORT),
  host: env.DATABASE_ENDPOINT,
  user: env.DATABASE_USERNAME,
  database: env.DATABASE_NAME,
  password: env.DATABASE_PASSWORD,
});

export const db = drizzle(connection, {
  logger: true,
  schema,
  mode: "default",
});
