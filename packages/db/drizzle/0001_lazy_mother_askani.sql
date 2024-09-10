ALTER TABLE "postOfUserNotOnApp" RENAME COLUMN "author" TO "author_id";--> statement-breakpoint
ALTER TABLE "postOfUserNotOnApp" DROP CONSTRAINT "postOfUserNotOnApp_author_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postOfUserNotOnApp" ADD CONSTRAINT "postOfUserNotOnApp_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
