import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { inject, injectable } from "inversify";

import type { Database, Schema } from "@oppfy/db";

import { TYPES } from "../container";
import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportRepository,
} from "../interfaces/repositories/reportRepository.interface";

@injectable()
export class ReportRepository implements IReportRepository {
  private db: Database; // Database instance
  private schema: Schema; // Schema object

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
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
