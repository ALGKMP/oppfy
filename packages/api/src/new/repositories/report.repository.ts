import { db, schema } from "@oppfy/db";

import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportRepository,
} from "../interfaces/repositories/i-report-repository";

export class ReportRepository implements IReportRepository {
  private db = db;

  async createUserReport(params: CreateUserReportParams): Promise<void> {
    await this.db.insert(schema.reportUser).values(params);
  }
  async createPostReport(params: CreatePostReportParams): Promise<void> {
    await this.db.insert(schema.reportPost).values(params);
  }
  async createCommentReport(params: CreateCommentReportParams): Promise<void> {
    await this.db.insert(schema.reportComment).values(params);
  }
}
