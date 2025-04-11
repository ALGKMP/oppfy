import { inject, injectable } from "inversify";
import { ok, Result } from "neverthrow";

import { TYPES } from "../../container";
import {
  ReportCommentReason,
  ReportPostReason,
  ReportUserReason,
} from "../../models";
import { ReportRepository } from "../../repositories/social/report.repository";

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
export class ReportService {
  constructor(
    @inject(TYPES.ReportRepository)
    private readonly reportRepository: ReportRepository,
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
