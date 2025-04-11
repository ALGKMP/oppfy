import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type {
  PostgresJsDatabase,
  PostgresJsQueryResultHKT,
} from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@oppfy/env";

import type {
  entityTypeEnum,
  eventTypeEnum,
  reportCommentReasonEnum,
  reportPostReasonEnum,
  reportUserReasonEnum,
} from "./src/schema";
import * as schema from "./src/schema";

export * from "drizzle-orm";

const queryClient = postgres(env.DATABASE_URL);

const db = drizzle(queryClient, {
  schema,
  logger: true,
});

type Schema = typeof schema;

type Database = PostgresJsDatabase<Schema>;
type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

type DatabaseOrTransaction = Database | Transaction;

export {
  db,
  schema,
  entityTypeEnum,
  eventTypeEnum,
  reportCommentReasonEnum,
  reportPostReasonEnum,
  reportUserReasonEnum,
};
export type { Schema, Database, Transaction, DatabaseOrTransaction };
