ALTER TABLE "profile_view" DROP CONSTRAINT "profile_view_viewed_profile_id_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_view" ADD COLUMN "viewed_user_id" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_view" ADD CONSTRAINT "profile_view_viewed_user_id_user_id_fk" FOREIGN KEY ("viewed_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profile_view" DROP COLUMN IF EXISTS "viewed_profile_id";