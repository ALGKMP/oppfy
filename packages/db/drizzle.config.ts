import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config({ path: "../../.env" });

export default {
  schema: "./src/schema",
  tablesFilter: ["t3turbo_*"],
  driver: "mysql2",
  dbCredentials: {
    host: process.env.DATABASE_ENDPOINT!,
    port: 3306,
    user: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
  },
} satisfies Config;
