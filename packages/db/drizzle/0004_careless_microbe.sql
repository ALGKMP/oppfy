DO $$ BEGIN
 CREATE TYPE "public"."account_status" AS ENUM('onApp', 'notOnApp');
 DROP TABLE "pendingUser";--> statement-breakpoint
DROP TABLE "postOfUserNotOnApp";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "account_status" "account_status" DEFAULT 'onApp' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "has_pending_posts";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "pending_posts_count";
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
