ALTER TABLE "notifications" RENAME TO "notification";--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notifications_sender_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "notification" DROP CONSTRAINT "notifications_recipient_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_recipient_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_sender_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_read_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_active_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_event_type_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_created_at_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification" ADD CONSTRAINT "notification_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_recipient_idx" ON "notification" ("recipient_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_sender_idx" ON "notification" ("sender_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_read_idx" ON "notification" ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_active_idx" ON "notification" ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_event_type_idx" ON "notification" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notification_created_at_idx" ON "notification" ("created_at");