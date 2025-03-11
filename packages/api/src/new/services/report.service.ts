import { inject, injectable } from "inversify";

import { TYPES } from "../container";
import type { IReportRepository } from "../interfaces/repositories/i-report-repository";
import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportService,
} from "../interfaces/services/i-report-service";

@injectable()
export class ReportService implements IReportService {
  private reportRepository: IReportRepository;

  constructor(
    @inject(TYPES.ReportRepository) reportRepository: IReportRepository,
  ) {
    this.reportRepository = reportRepository;
  }

  async reportUser(params: CreateUserReportParams): Promise<void> {
    await this.reportRepository.createUserReport(params);
  }

  async reportPost(params: CreatePostReportParams): Promise<void> {
    await this.reportRepository.createPostReport(params);
  }

  async reportComment(params: CreateCommentReportParams): Promise<void> {
    await this.reportRepository.createCommentReport(params);
  }
}
