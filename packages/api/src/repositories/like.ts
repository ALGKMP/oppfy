import { and, eq, count } from "drizzle-orm";

import { db, schema} from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class LikeRepository {
  private db = db;

  @handleDatabaseErrors
  async addLike(postId: number, userId: string) {
    return await this.db.insert(schema.like).values({
      postId: postId,
      user: userId,
      createdAt: new Date(), // Assuming current time is set by default
    });
  }

  @handleDatabaseErrors
  async removeLike(postId: number, userId: string) {
    return await this.db.delete(schema.like)
    .where(and(eq(schema.like.postId, postId), eq(schema.like.user, userId)));
  }

  @handleDatabaseErrors
  async countLikes(postId: number) {
    return await this.db.select({count: count()}).from(schema.like).where(eq(schema.like.postId, postId)).execute();
  }

  @handleDatabaseErrors
  async hasUserLiked(postId: number, userId: string) {
    const like = await this.db.query.like.findFirst({
      where: and(eq(schema.like.postId, postId), eq(schema.like.user, userId)),
    });
    return like !== undefined;
  }
}
