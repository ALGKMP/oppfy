ALTER TABLE "post" DROP CONSTRAINT "post_post_key_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_phone_number_unique";--> statement-breakpoint
ALTER TABLE "waitlist" DROP CONSTRAINT "waitlist_phone_number_unique";--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "current_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "longest_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "last_post_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "last_post_recipient_id" uuid;--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "last_post_author_id" uuid;--> statement-breakpoint
ALTER TABLE "friend" ADD COLUMN "last_post_id" uuid;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_last_post_recipient_id_user_id_fk" FOREIGN KEY ("last_post_recipient_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_last_post_author_id_user_id_fk" FOREIGN KEY ("last_post_author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_last_post_id_post_id_fk" FOREIGN KEY ("last_post_id") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_postKey_unique" UNIQUE("post_key");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_phoneNumber_unique" UNIQUE("phone_number");--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_phoneNumber_unique" UNIQUE("phone_number");--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_order_check" CHECK (user_id_a < user_id_b);--> statement-breakpoint
ALTER TABLE "friend" ADD CONSTRAINT "friend_self_check" CHECK (user_id_a != user_id_b);