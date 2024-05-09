import { and, asc, gt } from "drizzle-orm";

import { db, eq, or, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class CommentRepository {
  private db = db;

  @handleDatabaseErrors
  async addComment(postId: number, userId: string, body: string) {
    return await this.db.insert(schema.comment).values({
      post: postId,
      user: userId,
      body: body,
      createdAt: new Date(),
    });
  }

  @handleDatabaseErrors
  async removeComment(commentId: number) {
    return await this.db
      .delete(schema.comment)
      .where(eq(schema.comment.id, commentId));
  }

  @handleDatabaseErrors
  async getPaginatedComments(
    postId: number,
    cursor: { createdAt: Date; commentId: number } | null = null,
    pageSize = 10,
  ) {
    return await db
      .select({
        commentId: schema.comment.id,
        userId: schema.comment.user,
        username: schema.user.username,
        profilePictureUrl: schema.profilePicture.key,
        body: schema.comment.body,
        createdAt: schema.comment.createdAt,
      })
      .from(schema.comment)
      .innerJoin(schema.user, eq(schema.comment.user, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .innerJoin(
        schema.profilePicture,
        eq(schema.profile.profilePictureId, schema.profilePicture.id),
      )
      .where(
        and(
          eq(schema.like.postId, postId),
          cursor
            ? or(
                gt(schema.comment.createdAt, cursor.createdAt),
                and(
                  eq(schema.comment.createdAt, cursor.createdAt),
                  eq(schema.comment.id, cursor.commentId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(schema.like.createdAt), // Primary order by the creation date
        asc(schema.user.id), // Tiebreaker order by user ID
      )
      .limit(pageSize + 1);
  }
}
