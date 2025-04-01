import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportRepository,
} from "../../interfaces/repositories/user/report.repository.interface";

@injectable()
export class ReportRepository implements IReportRepository {
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
