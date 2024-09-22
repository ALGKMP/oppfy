import { and, eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class LikeRepository {
  private db = db;

  @handleDatabaseErrors
  async addLike(postId: string, userId: string) {
    return await this.db.insert(schema.like).values({
      postId: postId,
      userId: userId,
      createdAt: new Date(), // Assuming current time is set by default
    });
  }

  @handleDatabaseErrors
  async removeLike({ postId, userId }: { postId: string; userId: string }) {
    return await this.db
      .delete(schema.like)
      .where(
        and(eq(schema.like.postId, postId), eq(schema.like.userId, userId)),
      );
  }

  @handleDatabaseErrors
  async findLike({ postId, userId }: { postId: string; userId: string }) {
    return await this.db.query.like.findFirst({
      where: and(
        eq(schema.like.postId, postId),
        eq(schema.like.userId, userId),
      ),
    });
  }
}
