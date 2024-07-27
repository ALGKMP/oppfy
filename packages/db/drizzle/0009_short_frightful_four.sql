CREATE TABLE IF NOT EXISTS "userNotOnApp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"profile_picture_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "postOfUserNotOnApp" ADD COLUMN "recipient" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postOfUserNotOnApp" ADD CONSTRAINT "postOfUserNotOnApp_recipient_userNotOnApp_id_fk" FOREIGN KEY ("recipient") REFERENCES "public"."userNotOnApp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
