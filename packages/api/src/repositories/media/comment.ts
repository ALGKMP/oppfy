import { and, asc, count, desc, gt, lt, lte } from "drizzle-orm";

import { db, eq, or, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class CommentRepository {
  private db = db;

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
      post: postId,
      user: userId,
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
      .where(eq(schema.comment.post, postId));
    return result;
  }

  @handleDatabaseErrors
  async paginateComments(
    postId: string,
    cursor: { createdAt: Date; commentId: string } | null = null,
    pageSize = 10,
  ) {
    return await db
      .select({
        commentId: schema.comment.id,
        userId: schema.comment.user,
        username: schema.profile.username,
        profilePictureUrl: schema.profile.profilePictureKey,
        postId: schema.comment.post,
        body: schema.comment.body,
        createdAt: schema.comment.createdAt,
      })
      .from(schema.comment)
      .innerJoin(schema.user, eq(schema.user.id, schema.comment.user))
      .innerJoin(schema.profile, eq(schema.profile.id, schema.user.profileId))
      .where(
        and(
          eq(schema.comment.post, postId),
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
      .orderBy(
        desc(schema.comment.createdAt), // Primary order by the creation date
        desc(schema.comment.id),
      )
      .limit(pageSize + 1);
  }
}
