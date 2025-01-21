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
    // Get all users with their profile IDs
    const users = await db
      .select({
        id: schema.user.id,
        profileId: schema.user.profileId,
      })
      .from(schema.user);

    console.log(`Found ${users.length} users to process`);

    for (const user of users) {
      // Count regular posts
      const regularPostsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.post)
        .where(sql`${schema.post.authorId} = ${user.id}`);

      // Count friends (where user is either user1 or user2)
      const friendsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.friend)
        .where(
          sql`${schema.friend.userId1} = ${user.id} OR ${schema.friend.userId2} = ${user.id}`,
        );

      // Count followers (where user is the recipient)
      const followersResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.follower)
        .where(sql`${schema.follower.recipientId} = ${user.id}`);

      // Count following (where user is the sender)
      const followingResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.follower)
        .where(sql`${schema.follower.senderId} = ${user.id}`);

      const regularPosts = regularPostsResult[0]?.count ?? 0;
      const friends = friendsResult[0]?.count ?? 0;
      const followers = followersResult[0]?.count ?? 0;
      const following = followingResult[0]?.count ?? 0;

      // Update profile stats
      await db
        .update(schema.profileStats)
        .set({
          posts: regularPosts,
          friends,
          followers,
          following,
          updatedAt: new Date(),
        })
        .where(sql`${schema.profileStats.profileId} = ${user.profileId}`);

      console.log(
        `Updated user ${user.id}:`,
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
