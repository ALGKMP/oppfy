
import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const postStatsRepository = {
    createPostStats: async (postId: number) => {
      const result = await db
        .insert(schema.postStats)
        .values({ post: postId })
        .execute();
      return result[0].insertId; // Assuming auto-increment ID
    },
  
    getPostStats: async (postId: number) => {
      const profiles = await db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.post, postId));
      return profiles.length > 0 ? profiles[0] : null;
    },
  
    updatePostStats: async (postId: number, likes: number, comments: number, views: number) => {
      await db
        .update(schema.postStats)
        .set({
          likes,
          comments,
          views
        })
        .where(eq(schema.postStats.post, postId))
        .execute();
    },
  
    deletePostStats: async (postId: number) => {
      return await db
        .delete(schema.postStats)
        .where(eq(schema.postStats.post, postId))
        .execute();
    }
  };
  
  export default postStatsRepository;
  