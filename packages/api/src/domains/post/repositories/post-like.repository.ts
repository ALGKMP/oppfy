import { and, eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../../errors";
import type { IPostLikeRepository } from "../interfaces/post-repository.interface";

export class PostLikeRepository implements IPostLikeRepository {
  private db = db;

  @handleDatabaseErrors
  async getLike(userId: string, postId: string): Promise<boolean> {
    const like = await this.db.query.like.findFirst({
      where: and(
        eq(schema.like.userId, userId),
        eq(schema.like.postId, postId),
      ),
    });
    return !!like;
  }

  @handleDatabaseErrors
  async createLike(params: { userId: string; postId: string }): Promise<void> {
    await this.db.insert(schema.like).values(params);
  }

  @handleDatabaseErrors
  async deleteLike(userId: string, postId: string): Promise<void> {
    await this.db
      .delete(schema.like)
      .where(
        and(eq(schema.like.userId, userId), eq(schema.like.postId, postId)),
      );
  }
}
