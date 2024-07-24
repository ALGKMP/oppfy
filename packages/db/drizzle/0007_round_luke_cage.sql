CREATE TABLE IF NOT EXISTS "postOfUserNotOnApp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"author" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"key" text NOT NULL,
	"width" integer DEFAULT 500 NOT NULL,
	"height" integer DEFAULT 500 NOT NULL,
	"media_type" "media_type" DEFAULT 'image' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postOfUserNotOnApp" ADD CONSTRAINT "postOfUserNotOnApp_author_user_id_fk" FOREIGN KEY ("author") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
