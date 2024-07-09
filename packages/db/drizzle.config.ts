import type { Config } from "drizzle-kit";

import { env } from "@oppfy/env";

export default {
  schema: "./src/schema",
  tablesFilter: ["t3turbo_*"],
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    port: Number(env.DATABASE_PORT),
    host: env.DATABASE_ENDPOINT,
    user: env.DATABASE_USERNAME,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
  },
} satisfies Config;
