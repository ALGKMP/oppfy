DROP TABLE "test";

-- Show any remaining null values for debugging
SELECT id, username, user_id 
FROM "profile" 
WHERE "user_id" IS NULL;

-- -- Safety check
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM "profile" WHERE "user_id" IS NULL) THEN
    RAISE EXCEPTION 'Some profiles still have null user_id values';
  END IF;
END $$;

-- -- Make it NOT NULL only after we've verified the data
ALTER TABLE "profile" ALTER COLUMN "user_id" SET NOT NULL;