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

  getPostByKey: async (key: string) => {
    const result = await db
      .select()
      .from(schema.post)
      .where(eq(schema.post.key, key))
      .execute();
    return result[0]; // Assuming unique key
  },

  updatePost: async (key: string, newCaption: string) => {
    await db
      .update(schema.post)
      .set({ caption: newCaption })
      .where(eq(schema.post.key, key))
      .execute();
  },

  deletePost: async (key: string) => {
    await db.delete(schema.post).where(eq(schema.post.key, key)).execute();
  },
};

export default PostRepository;
