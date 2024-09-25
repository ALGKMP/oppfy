CREATE TABLE IF NOT EXISTS "test" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS user_delete_trigger ON "user";
DROP FUNCTION IF EXISTS update_stats_on_user_delete();