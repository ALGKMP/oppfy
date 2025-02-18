DO $$ BEGIN
 CREATE TYPE "public"."post_type" AS ENUM('public', 'private', 'direct');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP TABLE "post_view";--> statement-breakpoint
ALTER TABLE "blocked" RENAME TO "block";--> statement-breakpoint
ALTER TABLE "follower" RENAME TO "follow";--> statement-breakpoint
ALTER TABLE "report_profile" RENAME TO "report_user";--> statement-breakpoint
ALTER TABLE "block" RENAME COLUMN "user_id" TO "user_who_is_blocking_id";--> statement-breakpoint
ALTER TABLE "block" RENAME COLUMN "blocked_user_id" TO "user_who_is_blocked_id";--> statement-breakpoint
ALTER TABLE "friend" RENAME COLUMN "user_id_1" TO "user_id_a";--> statement-breakpoint
ALTER TABLE "friend" RENAME COLUMN "user_id_2" TO "user_id_b";--> statement-breakpoint
ALTER TABLE "report_comment" RENAME COLUMN "reporter_user_id" TO "submitted_by_user_id";--> statement-breakpoint
ALTER TABLE "report_post" RENAME COLUMN "reporter_user_id" TO "submitted_by_user_id";--> statement-breakpoint
ALTER TABLE "report_user" RENAME COLUMN "target_user_id" TO "reported_user_id";--> statement-breakpoint
ALTER TABLE "report_user" RENAME COLUMN "reporter_user_id" TO "submitted_by_user_id";--> statement-breakpoint
ALTER TABLE "user_status" RENAME COLUMN "has_posted" TO "has_completed_tutorial";--> statement-breakpoint
ALTER TABLE "block" DROP CONSTRAINT "blocked_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "block" DROP CONSTRAINT "blocked_blocked_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "follow" DROP CONSTRAINT "follower_sender_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "follow" DROP CONSTRAINT "follower_recipient_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "friend" DROP CONSTRAINT "friend_user_id_1_user_id_fk";
--> statement-breakpoint
ALTER TABLE "friend" DROP CONSTRAINT "friend_user_id_2_user_id_fk";
--> statement-breakpoint
ALTER TABLE "report_comment" DROP CONSTRAINT "report_comment_reporter_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "report_post" DROP CONSTRAINT "report_post_reporter_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "report_user" DROP CONSTRAINT "report_profile_target_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "report_user" DROP CONSTRAINT "report_profile_reporter_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_profile_id_profile_id_fk";
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "post_type" "post_type" DEFAULT 'public' NOT NULL;--> statement-breakpoint

-- First add the column as nullable
ALTER TABLE "profile" ADD COLUMN "user_id" uuid;

-- Update the relationships
UPDATE "profile" p
SET "user_id" = u.id
FROM "user" u
WHERE u.profile_id = p.id;

-- Show any remaining null values for debugging
-- SELECT id, username, user_id 
-- FROM "profile" 
-- WHERE "user_id" IS NULL;

-- -- Safety check
-- DO $$ 
-- BEGIN
--   IF EXISTS (SELECT 1 FROM "profile" WHERE "user_id" IS NULL) THEN
--     RAISE EXCEPTION 'Some profiles still have null user_id values';
--   END IF;
-- END $$;

-- -- Make it NOT NULL only after we've verified the data
-- ALTER TABLE "profile" ALTER COLUMN "user_id" SET NOT NULL;

-- Finally drop the old column
ALTER TABLE "user" DROP COLUMN IF EXISTS "profile_id";--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "block" ADD CONSTRAINT "block_user_who_is_blocking_id_user_id_fk" FOREIGN KEY ("user_who_is_blocking_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block" ADD CONSTRAINT "block_user_who_is_blocked_id_user_id_fk" FOREIGN KEY ("user_who_is_blocked_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow" ADD CONSTRAINT "follow_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow" ADD CONSTRAINT "follow_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_a_user_id_fk" FOREIGN KEY ("user_id_a") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_b_user_id_fk" FOREIGN KEY ("user_id_b") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_comment" ADD CONSTRAINT "report_comment_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_post" ADD CONSTRAINT "report_post_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_user" ADD CONSTRAINT "report_user_reported_user_id_user_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_user" ADD CONSTRAINT "report_user_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "post_stats" DROP COLUMN IF EXISTS "views";--> statement-breakpoint
ALTER TABLE "profile_stats" DROP COLUMN IF EXISTS "views";--> statement-breakpoint