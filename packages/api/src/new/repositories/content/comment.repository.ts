import { and, desc, eq, lte, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  CreateCommentParams,
  DeleteCommentParams,
  GetCommentParams,
  ICommentRepository,
  PaginateCommentsParams,
  PaginatedCommentResult,
} from "../../interfaces/repositories/content/comment.repository.interface";
import { Comment } from "../../models";

@injectable()
export class CommentRepository implements ICommentRepository {
  private readonly db: Database;
  private readonly schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async getComment(
    { commentId }: GetCommentParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Comment | undefined> {
    const comment = await db.query.comment.findFirst({
      where: eq(this.schema.comment.id, commentId),
    });

    return comment;
  }

  async createComment(
    { postId, userId, body }: CreateCommentParams,
    tx: Transaction,
  ): Promise<void> {
    await tx.insert(this.schema.comment).values({
      postId,
      userId,
      body,
    });

    await tx
      .update(this.schema.postStats)
      .set({
        comments: sql`comments + 1`,
      })
      .where(eq(this.schema.postStats.postId, postId));
  }

  async deleteComment(
    { commentId, postId }: DeleteCommentParams,
    tx: Transaction,
  ): Promise<void> {
    await tx
      .delete(this.schema.comment)
      .where(eq(this.schema.comment.id, commentId));

    await tx
      .update(this.schema.postStats)
      .set({
        comments: sql`comments - 1`,
      })
      .where(eq(this.schema.postStats.postId, postId));
  }

  async paginateComments(
    { postId, cursor, pageSize = 10 }: PaginateCommentsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<PaginatedCommentResult[]> {
    const commentsAndProfiles = await db
      .select({
        comment: this.schema.comment,
        profile: this.schema.profile,
      })
      .from(this.schema.comment)
      .innerJoin(
        this.schema.user,
        eq(this.schema.user.id, this.schema.comment.userId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.profile.userId, this.schema.user.id),
      )
      .where(
        and(
          eq(this.schema.comment.postId, postId),
          cursor
            ? or(
                lte(this.schema.comment.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.comment.createdAt, cursor.createdAt),
                  lte(this.schema.comment.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        desc(this.schema.comment.createdAt),
        desc(this.schema.comment.id),
      )
      .limit(pageSize);

    return commentsAndProfiles;
  }
}
