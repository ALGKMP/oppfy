import { z } from "zod";

import { reportPostOptions, reportProfileOptions } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { ReportRepository } from "../../repositories";

export class ReportService {
  private reportRepository = new ReportRepository();

  async reportPost(
    postId: number,
    reporterUserId: string,
    reason: z.infer<typeof reportPostOptions>,
  ) {
    const report = await this.reportRepository.createPostReport(
      reason,
      postId,
      reporterUserId,
    );

    if (!report) {
      console.error(`Failed to report post ${postId}`);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_POST);
    }
  }

  async reportComment(
    commentId: number,
    reporterUserId: string,
    reason: z.infer<typeof reportProfileOptions>,
  ) {
    const report = await this.reportRepository.createCommentReport(
      reason,
      commentId,
      reporterUserId,
    );

    if (!report) {
      console.error(`Failed to report comment ${commentId}`);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_COMMENT);
    }
  }

  async reportUser(
    targetUserId: string,
    reporterUserId: string,
    reason: z.infer<typeof reportProfileOptions>,
  ) {
    const report = await this.reportRepository.createUserReport(
      reason,
      targetUserId,
      reporterUserId,
    );

    if (!report) {
      console.error(`Failed to report user ${targetUserId}`);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_USER);
    }
  }
}
