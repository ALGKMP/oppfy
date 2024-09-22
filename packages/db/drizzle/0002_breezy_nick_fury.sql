ALTER TABLE "like" RENAME COLUMN "user" TO "user_id";--> statement-breakpoint
ALTER TABLE "like" DROP CONSTRAINT "like_user_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "like" ADD CONSTRAINT "like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;


DROP TRIGGER IF EXISTS user_delete_trigger ON "user";
DROP FUNCTION IF EXISTS update_stats_on_user_delete();

CREATE OR REPLACE FUNCTION update_stats_on_user_delete()

RETURNS TRIGGER AS $$
BEGIN
  -- Update post stats
  -- Decrement likes count
  UPDATE post_stats ps
  SET likes = likes - 1
  WHERE ps.post_id IN (
      SELECT DISTINCT post_id
      FROM "like"
      WHERE "user_id" = OLD.id
  );

  -- Decrement comments count
  UPDATE post_stats ps
  SET comments = comments - 1
  WHERE ps.post_id IN (
      SELECT DISTINCT post_id
      FROM comment
      WHERE "user_id" = OLD.id
  );

  -- Decrement views count
  UPDATE post_stats ps
  SET views = views - subquery.view_count
  FROM (
    SELECT post_id, COUNT(*) as view_count
    FROM post_view
    WHERE user_id = OLD.id
    GROUP BY post_id
  ) AS subquery
  WHERE ps.post_id = subquery.post_id;

  -- Update profile stats
  -- Decrement followers count for users that the deleted user was following
  UPDATE profile_stats
  SET followers = followers - 1
  WHERE profile_id IN (
    SELECT p.id
    FROM follower f
    JOIN "user" u ON f.recipient_id = u.id
    JOIN profile p ON u.profile_id = p.id
    WHERE f.sender_id = OLD.id
  );

  -- Decrement following count for users that were following the deleted user
  UPDATE profile_stats
  SET following = following - 1
  WHERE profile_id IN (
    SELECT p.id
    FROM follower f
    JOIN "user" u ON f.sender_id = u.id
    JOIN profile p ON u.profile_id = p.id
    WHERE f.recipient_id = OLD.id
  );

  -- Decrement friends count for users that were friends with the deleted user
  UPDATE profile_stats
  SET friends = friends - 1
  WHERE profile_id IN (
    SELECT p.id
    FROM friend f
    JOIN "user" u ON (
      CASE
        WHEN f.user_id_1 = OLD.id THEN f.user_id_2
        ELSE f.user_id_1
      END = u.id
    )
    JOIN profile p ON u.profile_id = p.id
    WHERE f.user_id_1 = OLD.id OR f.user_id_2 = OLD.id
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER user_delete_trigger
BEFORE DELETE ON "user"
FOR EACH ROW
EXECUTE FUNCTION update_stats_on_user_delete();