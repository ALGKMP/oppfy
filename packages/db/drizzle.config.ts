import { defineConfig } from "drizzle-kit";
import { readFileSync } from "fs";
import { join } from "path";

import { env } from "@oppfy/env";

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  tablesFilter: ["oppfy_*"],
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    port: Number(env.DATABASE_PORT),
    host: env.DATABASE_ENDPOINT,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: {
      rejectUnauthorized: true,
      ca: readFileSync(join(__dirname, "us-east-1-bundle.pem"), "utf8"),
    },
  },
});
