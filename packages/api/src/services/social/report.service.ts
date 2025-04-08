import { inject, injectable } from "inversify";
import { ok, Result } from "neverthrow";

import type { IReportRepository } from "../../interfaces/repositories/social/report.repository.interface";
import {
  CreateCommentReportParams,
  CreatePostReportParams,
  CreateUserReportParams,
  IReportService,
} from "../../interfaces/services/social/report.service.interface";
import { TYPES } from "../../types";

@injectable()
export class ReportService implements IReportService {
  constructor(
    @inject(TYPES.ReportRepository)
    private readonly reportRepository: IReportRepository,
  ) {}

  async reportUser(
    params: CreateUserReportParams,
  ): Promise<Result<void, never>> {
    await this.reportRepository.createUserReport(params);
    return ok();
  }

  async reportPost(
    params: CreatePostReportParams,
  ): Promise<Result<void, never>> {
    await this.reportRepository.createPostReport(params);
    return ok();
  }

  async reportComment(
    params: CreateCommentReportParams,
  ): Promise<Result<void, never>> {
    await this.reportRepository.createCommentReport(params);
    return ok();
  }
}
