// src/repository/PostRepository.ts
import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const PostRepository = {
  createPost: async (
    author: string,
    friend: string,
    caption: string,
    objectKey: string,
  ) => {
    const result = await db
      .insert(schema.post)
      .values({
        author,
        recipient: friend,
        caption,
        key: objectKey,
      })
      .execute();
    return result[0].insertId; // Assuming auto-increment ID
  },

  getPost: async (postId: number) => {
    const result = await db
      .select()
      .from(schema.post)
      .where(eq(schema.post.id, postId))
      .execute();
    return result[0]; // Assuming unique key
  },

  getAllUserPosts: async (userId: string) => {
    const result = await db
      .select()
      .from(schema.post)
      .where(eq(schema.post.author, userId));
    return result;
  },

  updatePost: async (postId: number, newCaption: string) => {
    await db
      .update(schema.post)
      .set({ caption: newCaption })
      .where(eq(schema.post.id, postId))
      .execute();
  },

  deletePost: async (postId: number) => {
    await db.delete(schema.post).where(eq(schema.post.id, postId)).execute();
  },

  createPostStats: async (postId: number) => {
    const result = await db
      .insert(schema.postStats)
      .values({ post: postId })
      .execute();
      return result[0].insertId; // Assuming auto-increment ID
  },
};

export default PostRepository;
