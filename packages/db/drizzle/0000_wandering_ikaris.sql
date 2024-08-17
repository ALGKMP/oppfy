DO $$ BEGIN
 CREATE TYPE "public"."entity_type" AS ENUM('post', 'profile', 'comment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_type" AS ENUM('like', 'post', 'comment', 'follow', 'friend');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."media_type" AS ENUM('image', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."privacy_setting" AS ENUM('public', 'private');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_reason" AS ENUM('Violent or abusive', 'Sexually explicit or predatory', 'Hate, harassment or bullying', 'Suicide and self-harm', 'Spam or scam', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_user_reason" AS ENUM('Posting explicit content', 'Under the age of 13', 'Catfish account', 'Scam/spam account');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blocked" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"blocked_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"post_id" bigint NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follow_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follower" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "friend" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id_1" text NOT NULL,
	"user_id_2" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "friend_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "like" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"user" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
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
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"event_type" "event_type" NOT NULL,
	"entity_id" text,
	"entity_type" "entity_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post" (
	"id" serial PRIMARY KEY NOT NULL,
	"author" text NOT NULL,
	"recipient" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"key" text NOT NULL,
	"width" integer DEFAULT 500 NOT NULL,
	"height" integer DEFAULT 500 NOT NULL,
	"media_type" "media_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "postOfUserNotOnApp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"author" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"recipient" uuid NOT NULL,
	"key" text NOT NULL,
	"width" integer DEFAULT 500 NOT NULL,
	"height" integer DEFAULT 500 NOT NULL,
	"media_type" "media_type" DEFAULT 'image' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_view" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"post_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"full_name" text,
	"date_of_birth" date,
	"bio" text,
	"profile_picture_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" bigint NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"following" integer DEFAULT 0 NOT NULL,
	"friends" integer DEFAULT 0 NOT NULL,
	"posts" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile_view" (
	"id" serial PRIMARY KEY NOT NULL,
	"viewer_user_id" text NOT NULL,
	"viewed_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" bigint NOT NULL,
	"reporter_user_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_post" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" bigint NOT NULL,
	"reporter_user_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_user_id" text NOT NULL,
	"reporter_user_id" text NOT NULL,
	"reason" "report_user_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" bigint NOT NULL,
	"notification_settings_id" bigint NOT NULL,
	"privacy_setting" "privacy_setting" DEFAULT 'public' NOT NULL,
	"phone_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_contact" (
	"user_id" text NOT NULL,
	"contact_id" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_contact_user_id_contact_id_pk" PRIMARY KEY("user_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userNotOnApp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"profile_picture_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked" ADD CONSTRAINT "blocked_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocked" ADD CONSTRAINT "blocked_blocked_user_id_user_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow_request" ADD CONSTRAINT "follow_request_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow_request" ADD CONSTRAINT "follow_request_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follower" ADD CONSTRAINT "follower_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follower" ADD CONSTRAINT "follower_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_1_user_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_2_user_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "like" ADD CONSTRAINT "like_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "like" ADD CONSTRAINT "like_user_user_id_fk" FOREIGN KEY ("user") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_author_user_id_fk" FOREIGN KEY ("author") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_recipient_user_id_fk" FOREIGN KEY ("recipient") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postOfUserNotOnApp" ADD CONSTRAINT "postOfUserNotOnApp_author_user_id_fk" FOREIGN KEY ("author") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "postOfUserNotOnApp" ADD CONSTRAINT "postOfUserNotOnApp_recipient_userNotOnApp_id_fk" FOREIGN KEY ("recipient") REFERENCES "public"."userNotOnApp"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_stats" ADD CONSTRAINT "post_stats_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_view" ADD CONSTRAINT "post_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_view" ADD CONSTRAINT "post_view_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_stats" ADD CONSTRAINT "profile_stats_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_view" ADD CONSTRAINT "profile_view_viewer_user_id_user_id_fk" FOREIGN KEY ("viewer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_view" ADD CONSTRAINT "profile_view_viewed_user_id_user_id_fk" FOREIGN KEY ("viewed_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_token" ADD CONSTRAINT "push_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_comment" ADD CONSTRAINT "report_comment_comment_id_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comment"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_comment" ADD CONSTRAINT "report_comment_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_post" ADD CONSTRAINT "report_post_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_post" ADD CONSTRAINT "report_post_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_profile" ADD CONSTRAINT "report_profile_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_profile" ADD CONSTRAINT "report_profile_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_notification_settings_id_notification_settings_id_fk" FOREIGN KEY ("notification_settings_id") REFERENCES "public"."notification_settings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_contact" ADD CONSTRAINT "user_contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_contact" ADD CONSTRAINT "user_contact_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_push_token" ON "push_token" ("token");