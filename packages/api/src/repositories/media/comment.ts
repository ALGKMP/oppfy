import { and, count, desc, lte } from "drizzle-orm";

import { db, eq, or, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class CommentRepository {
  private db = db;

  @handleDatabaseErrors
  async getComment(commentId: string) {
    return await this.db.query.comment.findFirst({
      where: eq(schema.comment.id, commentId),
    });
  }

  @handleDatabaseErrors
  async addComment({
    postId,
    userId,
    body,
  }: {
    postId: string;
    userId: string;
    body: string;
  }) {
    return await this.db.insert(schema.comment).values({
      postId,
      userId,
      body,
    });
  }

  @handleDatabaseErrors
  async removeComment(commentId: string) {
    return await this.db
      .delete(schema.comment)
      .where(eq(schema.comment.id, commentId));
  }

  @handleDatabaseErrors
  async countComments(postId: string) {
    const result = await this.db
      .select({ count: count() })
      .from(schema.comment)
      .where(eq(schema.comment.postId, postId));
    return result;
  }

  @handleDatabaseErrors
  async paginateComments(
    postId: string,
    cursor: { createdAt: Date; commentId: string } | null = null,
    pageSize: number,
  ) {
    return await this.db
      .select({
        commentId: schema.comment.id,
        userId: schema.comment.userId,
        username: schema.profile.username,
        profilePictureUrl: schema.profile.profilePictureKey,
        postId: schema.comment.postId,
        body: schema.comment.body,
        createdAt: schema.comment.createdAt,
      })
      .from(schema.comment)
      .innerJoin(schema.user, eq(schema.user.id, schema.comment.userId))
      .innerJoin(schema.profile, eq(schema.profile.id, schema.user.profileId))
      .where(
        and(
          eq(schema.comment.postId, postId),
          cursor
            ? or(
                lte(schema.comment.createdAt, cursor.createdAt),
                and(
                  eq(schema.comment.createdAt, cursor.createdAt),
                  lte(schema.comment.id, cursor.commentId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(schema.comment.createdAt), desc(schema.comment.id))
      .limit(pageSize + 1);
  }
}
