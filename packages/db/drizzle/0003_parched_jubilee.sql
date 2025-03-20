DO $$ BEGIN
 CREATE TYPE "public"."follow_status" AS ENUM('following', 'outbound_request', 'inbound_request');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."friend_status" AS ENUM('friends', 'outbound_request', 'inbound_request');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_comment_reason" AS ENUM('Violent or abusive', 'Sexually explicit or predatory', 'Hate, harassment or bullying', 'Suicide and self-harm', 'Spam or scam', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_post_reason" AS ENUM('Violent or abusive', 'Sexually explicit or predatory', 'Hate, harassment or bullying', 'Suicide and self-harm', 'Spam or scam', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_relationship" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id_a" uuid NOT NULL,
	"user_id_b" uuid NOT NULL,
	"friendship_status" "friend_status" NOT NULL,
	"follow_status" "follow_status" NOT NULL,
	"block_status" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_comment" RENAME COLUMN "submitted_by_user_id" TO "reporter_user_id";--> statement-breakpoint
ALTER TABLE "report_post" RENAME COLUMN "submitted_by_user_id" TO "reporter_user_id";--> statement-breakpoint
ALTER TABLE "report_user" RENAME COLUMN "submitted_by_user_id" TO "reporter_user_id";--> statement-breakpoint
ALTER TABLE "report_comment" DROP CONSTRAINT "report_comment_submitted_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "report_post" DROP CONSTRAINT "report_post_submitted_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "report_user" DROP CONSTRAINT "report_user_submitted_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "report_comment" ALTER COLUMN "reason" SET DATA TYPE report_comment_reason;--> statement-breakpoint
ALTER TABLE "report_post" ALTER COLUMN "reason" SET DATA TYPE report_post_reason;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_relationship" ADD CONSTRAINT "user_relationship_user_id_a_user_id_fk" FOREIGN KEY ("user_id_a") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_relationship" ADD CONSTRAINT "user_relationship_user_id_b_user_id_fk" FOREIGN KEY ("user_id_b") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_relationship_user_a_idx" ON "user_relationship" ("user_id_a");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_relationship_user_b_idx" ON "user_relationship" ("user_id_b");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_relationship_user_pair_unique" ON "user_relationship" ("user_id_a","user_id_b");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_comment" ADD CONSTRAINT "report_comment_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_post" ADD CONSTRAINT "report_post_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_user" ADD CONSTRAINT "report_user_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "block_blocking_user_idx" ON "block" ("user_who_is_blocking_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "block_blocked_user_idx" ON "block" ("user_who_is_blocked_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_unique_pair" ON "block" ("user_who_is_blocking_id","user_who_is_blocked_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_post_idx" ON "comment" ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_user_idx" ON "comment" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_sender_idx" ON "follow" ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_recipient_idx" ON "follow" ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_request_sender_idx" ON "follow_request" ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follow_request_recipient_idx" ON "follow_request" ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "follow_request_sender_recipient_unique" ON "follow_request" ("sender_id","recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friend_user_a_idx" ON "friend" ("user_id_a");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friend_user_b_idx" ON "friend" ("user_id_b");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "friend_user_pair_unique" ON "friend" ("user_id_a","user_id_b");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friend_request_sender_idx" ON "friend_request" ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "friend_request_recipient_idx" ON "friend_request" ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "friend_request_sender_recipient_unique" ON "friend_request" ("sender_id","recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "like_post_idx" ON "like" ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "like_user_idx" ON "like" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "like_post_user_unique" ON "like" ("post_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_recipient_idx" ON "notifications" ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_sender_idx" ON "notifications" ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_active_idx" ON "notifications" ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_event_type_idx" ON "notifications" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_author_idx" ON "post" ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_recipient_idx" ON "post" ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_type_idx" ON "post" ("post_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_created_at_idx" ON "post" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "profile_name_idx" ON "profile" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_comment_comment_idx" ON "report_comment" ("comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_comment_reporter_idx" ON "report_comment" ("reporter_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_post_post_idx" ON "report_post" ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_post_reporter_idx" ON "report_post" ("reporter_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_user_reported_idx" ON "report_user" ("reported_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_user_reporter_idx" ON "report_user" ("reporter_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_contact_user_idx" ON "user_contact" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_contact_contact_idx" ON "user_contact" ("contact_id");