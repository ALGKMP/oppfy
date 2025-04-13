import { and, desc, eq, lte, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import { withOnboardingCompleted } from "@oppfy/db/utils/query-helpers";

import { PaginationParams } from "../../interfaces/types";
import { Comment, Profile } from "../../models";
import { TYPES } from "../../symbols";

export interface GetCommentParams {
  commentId: string;
}

export interface DeleteCommentParams {
  commentId: string;
  postId: string;
}

export interface CreateCommentParams {
  userId: string;
  postId: string;
  body: string;
}

export interface PaginateCommentsParams extends PaginationParams {
  postId: string;
}

export interface PaginatedCommentResult {
  comment: Comment;
  profile: Profile;
}

@injectable()
export class CommentRepository {
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
    let query = db
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
      .limit(pageSize)
      .$dynamic();

    query = withOnboardingCompleted(query);

    const commentsAndProfiles = await query;

    return commentsAndProfiles;
  }
}
