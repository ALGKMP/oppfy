import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export default {
  schema: "./src/schema",
  tablesFilter: ["t3turbo_*"],
  driver: "mysql2",
  dbCredentials: {
    host: process.env.AWS_RDS_ENDPOINT!,
    port: 3306,
    user: process.env.AWS_RDS_USERNAME!,
    password: process.env.AWS_RDS_PASSWORD!,
    database: process.env.DATABASE!,
  }
} satisfies Config;
