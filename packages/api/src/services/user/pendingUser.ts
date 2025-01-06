import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@oppfy/db";
import { pendingUser, post, postOfUserNotOnApp, user } from "@oppfy/db/schema";

export const PendingUserService = {
  async createOrGetPendingUser({
    phoneNumber,
    name,
  }: {
    phoneNumber: string;
    name?: string;
  }) {
    // Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.phoneNumber, phoneNumber),
    });

    if (existingUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User already exists with this phone number",
      });
    }

    // Check if pending user exists
    let pendingUserRecord = await db.query.pendingUser.findFirst({
      where: eq(pendingUser.phoneNumber, phoneNumber),
    });

    // If no pending user exists, create one
    if (!pendingUserRecord) {
      pendingUserRecord = await db
        .insert(pendingUser)
        .values({
          phoneNumber,
          name,
        })
        .returning()
        .then((res) => res[0]);
    }

    return pendingUserRecord;
  },

  async createPostForPendingUser({
    authorId,
    pendingUserId,
    phoneNumber,
    mediaKey,
    caption,
    width,
    height,
    mediaType,
  }: {
    authorId: string;
    pendingUserId: string;
    phoneNumber: string;
    mediaKey: string;
    caption: string;
    width: number;
    height: number;
    mediaType: "image" | "video";
  }) {
    const post = await db
      .insert(postOfUserNotOnApp)
      .values({
        authorId,
        pendingUserId,
        phoneNumber,
        key: mediaKey,
        caption,
        width,
        height,
        mediaType,
      })
      .returning();

    return post[0];
  },

  async getPendingUserPosts(pendingUserId: string) {
    return db.query.postOfUserNotOnApp.findMany({
      where: eq(postOfUserNotOnApp.pendingUserId, pendingUserId),
      with: {
        author: {
          with: {
            profile: true,
          },
        },
      },
    });
  },

  async migratePendingUserPosts({
    pendingUserId,
    newUserId,
  }: {
    pendingUserId: string;
    newUserId: string;
  }) {
    // Get all pending posts
    const pendingPosts = await db.query.postOfUserNotOnApp.findMany({
      where: eq(postOfUserNotOnApp.pendingUserId, pendingUserId),
    });

    // Start a transaction to ensure all operations succeed or fail together
    return await db.transaction(async (tx) => {
      // Move each post to the regular posts table
      const migratedPosts = await Promise.all(
        pendingPosts.map(async (pendingPost) => {
          // Create new post
          const newPost = await tx
            .insert(post)
            .values({
              authorId: pendingPost.authorId,
              recipientId: newUserId, // The new user is the recipient
              caption: pendingPost.caption,
              key: pendingPost.key,
              width: pendingPost.width,
              height: pendingPost.height,
              mediaType: pendingPost.mediaType,
            })
            .returning()
            .then((res) => res[0]);

          // Delete the pending post
          await tx
            .delete(postOfUserNotOnApp)
            .where(eq(postOfUserNotOnApp.id, pendingPost.id));

          return newPost;
        }),
      );

      // Delete the pending user
      await tx.delete(pendingUser).where(eq(pendingUser.id, pendingUserId));

      return migratedPosts;
    });
  },

  async getPendingPostsForPhoneNumber(phoneNumber: string) {
    const pendingUserRecord = await db.query.pendingUser.findFirst({
      where: eq(pendingUser.phoneNumber, phoneNumber),
    });

    if (!pendingUserRecord) {
      return [];
    }

    return this.getPendingUserPosts(pendingUserRecord.id);
  },
};
