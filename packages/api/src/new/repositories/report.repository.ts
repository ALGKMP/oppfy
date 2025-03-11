import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
} from "@oppfy/db";

import { TYPES } from "../container";
import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportRepository,
} from "../interfaces/repositories/reportRepository.interface";

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
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.reportUser).values(params);
  }

  async createPostReport(
    params: CreatePostReportParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.reportPost).values(params);
  }

  async createCommentReport(
    params: CreateCommentReportParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx.insert(this.schema.reportComment).values(params);
  }
}
