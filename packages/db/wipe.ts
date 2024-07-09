import readline from "readline";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@oppfy/env";

const queryClient = postgres(env.DATABASE_URL);

const db = drizzle(queryClient);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function wipeDatabase() {
  console.log("WARNING: This will completely wipe the database!");
  console.log("Database URL:", env.DATABASE_URL);

  const confirm = await promptUser(
    "Are you absolutely sure you want to wipe the database? Type 'YES' to confirm: ",
  );
  if (confirm !== "YES") {
    console.log("Database wipe cancelled.");
    rl.close();
    return;
  }

  console.log("Starting database wipe...");

  try {
    // Drop all tables
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    // Drop all types (including enums)
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema()) AND typtype = 'e') LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log("Database wiped successfully.");
  } catch (error) {
    console.error("Error wiping database:", error);
  } finally {
    rl.close();
    await queryClient.end();
  }
}

await wipeDatabase();
