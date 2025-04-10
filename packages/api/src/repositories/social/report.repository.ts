import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import type {
  ReportCommentReason,
  ReportPostReason,
  ReportUserReason,
} from "../../models";
import { TYPES } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
type ReportReason = ReportUserReason | ReportPostReason | ReportCommentReason;

export interface ReportParams<T extends ReportReason> {
  reason: T;
  userId: string;
}

export type CreateUserReportParams = ReportParams<ReportUserReason> & {
  reportedUserId: string;
};

export type CreatePostReportParams = ReportParams<ReportPostReason> & {
  reportedPostId: string;
};

export type CreateCommentReportParams = ReportParams<ReportCommentReason> & {
  reportedCommentId: string;
};

@injectable()
export class ReportRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async createUserReport(
    params: CreateUserReportParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db.insert(this.schema.reportUser).values({
      reporterUserId: params.userId,
      reportedUserId: params.reportedUserId,
      reason: params.reason,
    });
  }

  async createPostReport(
    params: CreatePostReportParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db.insert(this.schema.reportPost).values({
      reporterUserId: params.userId,
      postId: params.reportedPostId,
      reason: params.reason,
    });
  }

  async createCommentReport(
    params: CreateCommentReportParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db.insert(this.schema.reportComment).values({
      reporterUserId: params.userId,
      commentId: params.reportedCommentId,
      reason: params.reason,
    });
  }
}
