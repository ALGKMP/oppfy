CREATE TABLE IF NOT EXISTS "user_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_on_app" boolean DEFAULT true NOT NULL,
	"has_posted" boolean DEFAULT false NOT NULL,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_status" ADD CONSTRAINT "user_status_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "posted";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "account_status";