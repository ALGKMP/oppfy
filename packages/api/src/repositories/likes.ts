import { eq, count, and } from "drizzle-orm";

import { db, schema } from "@acme/db";

const likesRepository = {
    addLike: async (postId: number, userId: string) => {
      const result = await db
        .insert(schema.like)
        .values({ post: postId, user: userId })
        .execute();
      return result[0].insertId;
    },
  
    removeLike: async (postId: number, userId: string) => {
      await db
        .delete(schema.like)
        .where(and(eq(schema.like.post, postId), eq(schema.like.user, userId)));
    },
  
    countLikes: async (postId: number) => {
      const result = await db
        .select({count: count()}).from(schema.like)
        .where(eq(schema.like.post, postId))
      return result[0]?.count;
    },
  
    hasUserLiked: async (postId: number, userId: string) => {
      const result = await db
        .select()
        .from(schema.like)
        .where(and(eq(schema.like.post, postId),eq(schema.like.user, userId)))
      return result.length > 0;
    }
  };
  
  export default likesRepository;
  