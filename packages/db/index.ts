import { drizzle } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";

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

