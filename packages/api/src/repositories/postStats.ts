
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
}

export default postStatsRepository;