// import "dotenv/config";

// import { migrate } from "drizzle-orm/mysql2/migrator";

// import { connection, db } from "./index";

// // This will run migrations on the database, skipping the ones already applied
// await migrate(db, { migrationsFolder: "./drizzle" });

// // Don't forget to close the connection, otherwise the script will hang
// await connection.end();

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "@oppfy/env";

const migrationClient = postgres(env.DATABASE_URL, { max: 1 });

await migrate(drizzle(migrationClient), {
  migrationsFolder: "./drizzle",
});

await migrationClient.end();
