// import type { Config } from "drizzle-kit";
import { defineConfig } from "drizzle-kit";

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
  },
});
