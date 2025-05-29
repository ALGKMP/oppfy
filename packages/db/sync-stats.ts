import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@oppfy/env";

import { schema } from ".";

const queryClient = postgres(env.DATABASE_URL);
const db = drizzle(queryClient, {
  schema,
  casing: "snake_case",
  logger: true,
});

async function syncUserStats() {
  console.log("Starting user stats sync...");
  try {
    const users = await db
      .select({
        id: schema.user.id,
      })
      .from(schema.user);

    console.log(`Found ${users.length} users to process`);

    for (const user of users) {
      const postsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.post)
        .where(sql`${schema.post.recipientUserId} = ${user.id}`);

      const friendsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.friend)
        .where(
          sql`${schema.friend.userIdA} = ${user.id} OR ${schema.friend.userIdB} = ${user.id}`,
        );

      const followersResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.follow)
        .where(sql`${schema.follow.recipientUserId} = ${user.id}`);

      const followingResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.follow)
        .where(sql`${schema.follow.senderUserId} = ${user.id}`);

      const friendRequestsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.friendRequest)
        .where(sql`${schema.friendRequest.recipientUserId} = ${user.id}`);

      const followRequestsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.followRequest)
        .where(sql`${schema.followRequest.recipientUserId} = ${user.id}`);

      const posts = postsResult[0]?.count ?? 0;
      const friends = friendsResult[0]?.count ?? 0;
      const followers = followersResult[0]?.count ?? 0;
      const following = followingResult[0]?.count ?? 0;
      const friendRequests = friendRequestsResult[0]?.count ?? 0;
      const followRequests = followRequestsResult[0]?.count ?? 0;

      await db
        .update(schema.userStats)
        .set({
          posts,
          friends,
          followers,
          following,
          friendRequests,
          followRequests,
          updatedAt: new Date(),
        })
        .where(sql`${schema.userStats.userId} = ${user.id}`);

      console.log(
        `Updated user ${user.id}:`,
        `\n- ${posts} posts`,
        `\n- ${friends} friends`,
        `\n- ${followers} followers`,
        `\n- ${following} following`,
        `\n- ${friendRequests} friend requests`,
        `\n- ${followRequests} follow requests`,
      );
    }

    console.log("User stats sync completed successfully!");
  } catch (error) {
    console.error("Error syncing user stats:", error);
    throw error;
  }
}

async function syncPostStats() {
  console.log("Starting post stats sync...");
  try {
    const posts = await db
      .select({
        id: schema.post.id,
      })
      .from(schema.post);

    console.log(`Found ${posts.length} posts to process`);

    for (const post of posts) {
      const likesResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.like)
        .where(sql`${schema.like.postId} = ${post.id}`);

      const commentsResult = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(schema.comment)
        .where(sql`${schema.comment.postId} = ${post.id}`);

      const likes = likesResult[0]?.count ?? 0;
      const comments = commentsResult[0]?.count ?? 0;

      await db
        .update(schema.postStats)
        .set({
          likes,
          comments,
          updatedAt: new Date(),
        })
        .where(sql`${schema.postStats.postId} = ${post.id}`);

      console.log(
        `Updated post ${post.id}:`,
        `\n- ${likes} likes`,
        `\n- ${comments} comments`,
      );
    }

    console.log("Post stats sync completed successfully!");
  } catch (error) {
    console.error("Error syncing post stats:", error);
    throw error;
  }
}

async function syncStats() {
  try {
    await syncUserStats();
    await syncPostStats();
    console.log("All stats synced successfully!");
  } catch (error) {
    console.error("Error syncing stats:", error);
    process.exit(1);
  } finally {
    await queryClient.end();
    process.exit(0);
  }
}

void syncStats();
