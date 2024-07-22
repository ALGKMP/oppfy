ALTER TABLE "post" DROP CONSTRAINT "post_author_user_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_stats" ADD COLUMN "friends" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_author_user_id_fk" FOREIGN KEY ("author") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
