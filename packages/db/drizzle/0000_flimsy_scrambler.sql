CREATE TYPE "public"."entity_type" AS ENUM('post', 'profile', 'comment');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('like', 'post', 'comment', 'follow', 'friend');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('pending', 'processed');--> statement-breakpoint
CREATE TYPE "public"."privacy" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."report_comment_reason" AS ENUM('Violent or abusive', 'Sexually explicit or predatory', 'Hate, harassment or bullying', 'Suicide and self-harm', 'Spam or scam', 'Other');--> statement-breakpoint
CREATE TYPE "public"."report_post_reason" AS ENUM('Violent or abusive', 'Sexually explicit or predatory', 'Hate, harassment or bullying', 'Suicide and self-harm', 'Spam or scam', 'Other');--> statement-breakpoint
CREATE TYPE "public"."report_user_reason" AS ENUM('Posting explicit content', 'Under the age of 13', 'Catfish account', 'Scam/spam account');--> statement-breakpoint
CREATE TABLE "block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id_a" uuid NOT NULL,
	"user_id_b" uuid NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_post_date" timestamp with time zone,
	"last_post_recipient_id" uuid,
	"last_post_author_id" uuid,
	"last_post_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friend_order_check" CHECK (user_id_a < user_id_b),
	CONSTRAINT "friend_self_check" CHECK (user_id_a != user_id_b)
);
--> statement-breakpoint
CREATE TABLE "friend_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "like" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"event_type" "event_type" NOT NULL,
	"entity_id" varchar(255),
	"entity_type" "entity_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"posts" boolean DEFAULT true NOT NULL,
	"likes" boolean DEFAULT true NOT NULL,
	"mentions" boolean DEFAULT true NOT NULL,
	"comments" boolean DEFAULT true NOT NULL,
	"follow_requests" boolean DEFAULT true NOT NULL,
	"friend_requests" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"caption" text,
	"post_key" text NOT NULL,
	"width" integer DEFAULT 500 NOT NULL,
	"height" integer DEFAULT 500 NOT NULL,
	"media_type" "media_type" NOT NULL,
	"status" "post_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_postKey_unique" UNIQUE("post_key")
);
--> statement-breakpoint
CREATE TABLE "post_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"privacy" "privacy" DEFAULT 'public' NOT NULL,
	"username" varchar(30),
	"name" varchar(30),
	"date_of_birth" timestamp,
	"bio" varchar(100),
	"profile_picture_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "push_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" "report_comment_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" "report_post_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reported_user_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" "report_user_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_phoneNumber_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "user_contact" (
	"user_id" uuid NOT NULL,
	"contact_id" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_contact_user_id_contact_id_pk" PRIMARY KEY("user_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"following" integer DEFAULT 0 NOT NULL,
	"friends" integer DEFAULT 0 NOT NULL,
	"friend_requests" integer DEFAULT 0 NOT NULL,
	"follow_requests" integer DEFAULT 0 NOT NULL,
	"posts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"is_on_app" boolean DEFAULT true NOT NULL,
	"has_completed_tutorial" boolean DEFAULT false NOT NULL,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_phoneNumber_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow" ADD CONSTRAINT "follow_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_request" ADD CONSTRAINT "follow_request_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_request" ADD CONSTRAINT "follow_request_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_a_user_id_fk" FOREIGN KEY ("user_id_a") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_b_user_id_fk" FOREIGN KEY ("user_id_b") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_last_post_recipient_id_user_id_fk" FOREIGN KEY ("last_post_recipient_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_last_post_author_id_user_id_fk" FOREIGN KEY ("last_post_author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_last_post_id_post_id_fk" FOREIGN KEY ("last_post_id") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "like" ADD CONSTRAINT "like_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "like" ADD CONSTRAINT "like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_stats" ADD CONSTRAINT "post_stats_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report_comment" ADD CONSTRAINT "report_comment_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_comment" ADD CONSTRAINT "report_comment_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report_post" ADD CONSTRAINT "report_post_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_post" ADD CONSTRAINT "report_post_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report_user" ADD CONSTRAINT "report_user_reported_user_id_user_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report_user" ADD CONSTRAINT "report_user_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_contact" ADD CONSTRAINT "user_contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_contact" ADD CONSTRAINT "user_contact_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_status" ADD CONSTRAINT "user_status_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_sender_user_idx" ON "block" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "block_recipient_user_idx" ON "block" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "block_unique_pair" ON "block" USING btree ("sender_user_id","recipient_user_id");--> statement-breakpoint
CREATE INDEX "comment_post_idx" ON "comment" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "comment_user_idx" ON "comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "follow_sender_idx" ON "follow" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "follow_recipient_idx" ON "follow" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "follow_request_sender_idx" ON "follow_request" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "follow_request_recipient_idx" ON "follow_request" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follow_request_sender_recipient_unique" ON "follow_request" USING btree ("sender_user_id","recipient_user_id");--> statement-breakpoint
CREATE INDEX "friend_user_a_idx" ON "friend" USING btree ("user_id_a");--> statement-breakpoint
CREATE INDEX "friend_user_b_idx" ON "friend" USING btree ("user_id_b");--> statement-breakpoint
CREATE UNIQUE INDEX "friend_user_pair_unique" ON "friend" USING btree ("user_id_a","user_id_b");--> statement-breakpoint
CREATE INDEX "friend_request_sender_idx" ON "friend_request" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "friend_request_recipient_idx" ON "friend_request" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "friend_request_sender_recipient_unique" ON "friend_request" USING btree ("sender_user_id","recipient_user_id");--> statement-breakpoint
CREATE INDEX "like_post_idx" ON "like" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "like_user_idx" ON "like" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "like_post_user_unique" ON "like" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "notification_recipient_idx" ON "notification" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "notification_sender_idx" ON "notification" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "notification" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notification_active_idx" ON "notification" USING btree ("active");--> statement-breakpoint
CREATE INDEX "notification_event_type_idx" ON "notification" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "post_author_user_idx" ON "post" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "post_recipient_user_idx" ON "post" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "post_created_at_idx" ON "post" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "profile_name_idx" ON "profile" USING btree ("name");--> statement-breakpoint
CREATE INDEX "report_comment_comment_idx" ON "report_comment" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "report_comment_reporter_idx" ON "report_comment" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE INDEX "report_post_post_idx" ON "report_post" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "report_post_reporter_idx" ON "report_post" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE INDEX "report_user_reported_idx" ON "report_user" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "report_user_reporter_idx" ON "report_user" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE INDEX "user_contact_user_idx" ON "user_contact" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_contact_contact_idx" ON "user_contact" USING btree ("contact_id");