import { inject, injectable } from "inversify";

import { TYPES } from "../container";
import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportRepository,
} from "../interfaces/repositories/i-report-repository";

@injectable()
export class ReportRepository implements IReportRepository {
  private db: any; // Database instance
  private schema: any; // Schema object

  constructor(
    @inject(TYPES.Database) db: any,
    @inject(TYPES.Schema) schema: any,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async createUserReport(params: CreateUserReportParams): Promise<void> {
    await this.db.insert(this.schema.reportUser).values(params);
  }

  async createPostReport(params: CreatePostReportParams): Promise<void> {
    await this.db.insert(this.schema.reportPost).values(params);
  }

  async createCommentReport(params: CreateCommentReportParams): Promise<void> {
    await this.db.insert(this.schema.reportComment).values(params);
  }
}
