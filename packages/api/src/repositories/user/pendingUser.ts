import { and, eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

export const PendingUserRepository = {
  async findByPhoneNumber(phoneNumber: string) {
    return db.query.pendingUser.findFirst({
      where: eq(schema.pendingUser.phoneNumber, phoneNumber),
    });
  },

  async create(data: { phoneNumber: string }) {
    return db
      .insert(schema.pendingUser)
      .values(data)
      .returning()
      .then((res) => res[0]);
  },

  async createPost(data: {
    authorId: string;
    pendingUserId: string;
    phoneNumber: string;
    key: string;
    caption: string;
    width: number;
    height: number;
    mediaType: "image" | "video";
  }) {
    return db
      .insert(schema.postOfUserNotOnApp)
      .values(data)
      .returning()
      .then((res) => res[0]);
  },

  async findPostsByPendingUserId(pendingUserId: string) {
    return db.query.postOfUserNotOnApp.findMany({
      where: eq(schema.postOfUserNotOnApp.pendingUserId, pendingUserId),
      with: {
        author: {
          with: {
            profile: true,
          },
        },
      },
    });
  },

  async findPostsByPhoneNumber(phoneNumber: string) {
    const pendingUserRecord = await this.findByPhoneNumber(phoneNumber);
    if (!pendingUserRecord) return [];

    return this.findPostsByPendingUserId(pendingUserRecord.id);
  },

  async updateUserPendingPostsStatus(userId: string, postCount: number) {
    await db
      .update(schema.user)
      .set({
        hasPendingPosts: postCount > 0,
        pendingPostsCount: postCount,
      })
      .where(eq(schema.user.id, userId));
  },

  async migratePosts({
    pendingUserId,
    newUserId,
  }: {
    pendingUserId: string;
    newUserId: string;
  }) {
    return await db.transaction(async (tx) => {
      const pendingPosts = await db.query.postOfUserNotOnApp.findMany({
        where: eq(schema.postOfUserNotOnApp.pendingUserId, pendingUserId),
        with: {
          author: true,
        },
      });

      const migratedPosts = await Promise.all(
        pendingPosts.map(async (pendingPost) => {
          // Create new post
          const newPost = await tx
            .insert(schema.post)
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

          // Create notification
/*           await tx.insert(schema.notifications).values({
            senderId: newUserId,
            recipientId: pendingPost.authorId,
            eventType: "post",
            entityId: newPost.id,
            entityType: "post",
          });
 */
          // Delete pending post
          await tx
            .delete(schema.postOfUserNotOnApp)
            .where(eq(schema.postOfUserNotOnApp.id, pendingPost.id));

          return newPost;
        }),
      );

      // Delete pending user
      await tx
        .delete(schema.pendingUser)
        .where(eq(schema.pendingUser.id, pendingUserId));

      // Update user status
      await tx
        .update(schema.user)
        .set({
          hasPendingPosts: false,
          pendingPostsCount: 0,
        })
        .where(eq(schema.user.id, newUserId));

      return migratedPosts;
    });
  },
};
