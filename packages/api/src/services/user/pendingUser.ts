import { TRPCError } from "@trpc/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@oppfy/db";
import {
  notifications,
  pendingUser,
  post,
  postOfUserNotOnApp,
  user,
} from "@oppfy/db/schema";

const MAX_PENDING_POSTS_PER_DAY = 10; // Rate limit: max 10 posts per day to non-registered users
const PHONE_NUMBER_REGEX = /^\+[1-9]\d{1,14}$/; // E.164 format

export const PendingUserService = {
  async validatePhoneNumber(phoneNumber: string) {
    if (!PHONE_NUMBER_REGEX.test(phoneNumber)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Invalid phone number format. Please use international format (e.g., +1234567890)",
      });
    }
  },

  async checkRateLimit(authorId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const postsToday = await db.query.postOfUserNotOnApp.findMany({
      where: and(
        eq(postOfUserNotOnApp.authorId, authorId),
        gte(postOfUserNotOnApp.createdAt, today),
      ),
    });

    if (postsToday.length >= MAX_PENDING_POSTS_PER_DAY) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `You can only create ${MAX_PENDING_POSTS_PER_DAY} posts per day for non-registered users`,
      });
    }
  },

  async createOrGetPendingUser({
    phoneNumber,
    name,
  }: {
    phoneNumber: string;
    name?: string;
  }) {
    await this.validatePhoneNumber(phoneNumber);

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
    // Validate phone number format
    await this.validatePhoneNumber(phoneNumber);

    // Check rate limit
    await this.checkRateLimit(authorId);

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
      with: {
        author: true,
      },
    });

    // Start a transaction to ensure all operations succeed or fail together
    return await db.transaction(async (tx) => {
      // Move each post to the regular posts table
      const migratedPosts = await Promise.all(
        pendingPosts.map(async (pendingPost) => {
          // Create new post (initially private)
          const newPost = await tx
            .insert(post)
            .values({
              authorId: pendingPost.authorId,
              recipientId: newUserId,
              caption: pendingPost.caption,
              key: pendingPost.key,
              width: pendingPost.width,
              height: pendingPost.height,
              mediaType: pendingPost.mediaType,
            })
            .returning()
            .then((res) => res[0]);

          // Create notification for the original poster
          await tx.insert(notifications).values({
            senderId: newUserId,
            recipientId: pendingPost.authorId,
            eventType: "post",
            entityId: newPost.id,
            entityType: "post",
          });

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
