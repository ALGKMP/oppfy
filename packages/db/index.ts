import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@oppfy/env";

import * as schema from "./src/schema";

export * from "drizzle-orm";

const queryClient = postgres(env.DATABASE_URL);

const db = drizzle(queryClient, {
  schema,
  logger: true,
});

export { db, schema };
