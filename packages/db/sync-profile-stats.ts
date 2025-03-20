import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@oppfy/env";

import { schema } from ".";

const queryClient = postgres(env.DATABASE_URL);
const db = drizzle(queryClient);

async function syncProfileStats() {
  console.log("Starting profile stats sync...");

  try {
    // Get all profiles with their user IDs
    const profiles = await db
      .select({
        id: schema.profile.id,
        userId: schema.profile.userId,
      })
      .from(schema.profile);

    console.log(`Found ${profiles.length} profiles to process`);

    for (const profile of profiles) {
      // Count posts where user is the recipient (post owner)
      const regularPostsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.post)
        .where(sql`${schema.post.recipientId} = ${profile.userId}`);

      // Count friends (where user is either user1 or user2)
      const friendsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.friend)
        .where(
          sql`${schema.friend.userIdA} = ${profile.userId} OR ${schema.friend.userIdB} = ${profile.userId}`,
        );

      // Count followers (where user is the recipient)
      const followersResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.follow)
        .where(sql`${schema.follow.recipientId} = ${profile.userId}`);

      // Count following (where user is the sender)
      const followingResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.follow)
        .where(sql`${schema.follow.senderId} = ${profile.userId}`);

      const regularPosts = regularPostsResult[0]?.count ?? 0;
      const friends = friendsResult[0]?.count ?? 0;
      const followers = followersResult[0]?.count ?? 0;
      const following = followingResult[0]?.count ?? 0;

      // Update profile stats
      await db
        .update(schema.userStats)
        .set({
          posts: regularPosts,
          friends,
          followers,
          following,
          updatedAt: new Date(),
        })
        .where(sql`${schema.userStats.profileId} = ${profile.id}`);

      console.log(
        `Updated profile ${profile.id} for user ${profile.userId}:`,
        `\n- ${regularPosts} posts`,
        `\n- ${friends} friends`,
        `\n- ${followers} followers`,
        `\n- ${following} following`,
      );
    }

    console.log("Profile stats sync completed successfully!");
  } catch (error) {
    console.error("Error syncing profile stats:", error);
    process.exit(1);
  } finally {
    await queryClient.end();
    process.exit(0);
  }
}

// Run the sync
void syncProfileStats();
