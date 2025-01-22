CREATE TABLE IF NOT EXISTS "pendingUser" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pendingUser_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "postOfUserNotOnApp" ADD COLUMN "pending_user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "has_pending_posts" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "pending_posts_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postOfUserNotOnApp" ADD CONSTRAINT "postOfUserNotOnApp_pending_user_id_pendingUser_id_fk" FOREIGN KEY ("pending_user_id") REFERENCES "public"."pendingUser"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
