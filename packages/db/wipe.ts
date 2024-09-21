import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@oppfy/env";
import { auth } from "@oppfy/firebase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queryClient = postgres(env.DATABASE_URL);

const db = drizzle(queryClient);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const promptUser = async (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

const wipeDatabase = async () => {
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

    // Delete drizzle/meta directory
    const drizzlePath = path.join(__dirname, "drizzle");
    if (fs.existsSync(drizzlePath)) {
      fs.rmSync(drizzlePath, { recursive: true, force: true });
      fs.mkdirSync(drizzlePath);
      console.log("Drizzle meta directory deleted successfully.");
    } else {
      console.log("Drizzle meta directory not found.");
    }

    // Wipe Firebase accounts
    console.log("Wiping Firebase accounts...");
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;

    for (const user of users) {
      await auth.deleteUser(user.uid);
    }

    console.log(`${users.length} Firebase accounts deleted successfully.`);

    console.log(
      "Database wiped, meta directory deleted, and Firebase accounts removed successfully.",
    );
  } catch (error) {
    console.error("Error during wipe process:", error);
  } finally {
    rl.close();
    await queryClient.end();
    // No need to clean up Firebase Admin SDK here as it's managed elsewhere
  }
};

await wipeDatabase();
