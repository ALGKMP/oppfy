import { and, eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class LikesRepository {
  private db = db;

  @handleDatabaseErrors
  async addLike(postId: number, userId: string) {
    return await this.db
      .insert(schema.like)
      .values({ postId, user: userId })
      .execute();
  }

  @handleDatabaseErrors
  async removeLike(postId: number, userId: string) {
    await this.db
      .delete(schema.like)
      .where(and(eq(schema.like.postId, postId), eq(schema.like.user, userId)));
  }

  @handleDatabaseErrors
  async countLikes(postId: number) {
    const like = await this.db.query.like.findMany({
      where: eq(schema.like.postId, postId),
    });
    return like.length;
  }

  @handleDatabaseErrors
  async hasUserLiked(postId: number, userId: string) {
    const like = await this.db.query.like.findFirst({
      where: and(eq(schema.like.postId, postId), eq(schema.like.user, userId)),
    });
    return like !== undefined;
  }
}
