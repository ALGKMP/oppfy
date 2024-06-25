import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { ReportRepository } from "../../repositories";

export class ReportService {
  private reportRepository = new ReportRepository();

  async reportPost({
    postId,
    reporterUserId,
    reason,
  }: {
    postId: number;
    reporterUserId: string;
    reason: z.infer<typeof sharedValidators.report.reportPostOptions>;
  }) {
    try {
      await this.reportRepository.createPostReport(
        reason,
        postId,
        reporterUserId,
      );
    } catch (error) {
      console.error(`Error reporting post ${postId}:`, error);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_POST);
    }
  }

  async reportComment({
    commentId,
    reporterUserId,
    reason,
  }: {
    commentId: number;
    reporterUserId: string;
    reason: z.infer<typeof sharedValidators.report.reportCommentOptions>;
  }) {
    try {
      await this.reportRepository.createCommentReport(
        reason,
        commentId,
        reporterUserId,
      );
    } catch (error) {
      console.error(`Error reporting comment ${commentId}:`, error);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_COMMENT);
    }
  }

  async reportUser({
    targetUserId,
    reporterUserId,
    reason,
  }: {
    targetUserId: string;
    reporterUserId: string;
    reason: z.infer<typeof sharedValidators.report.reportUserOptions>;
  }) {
    try {
      await this.reportRepository.createUserReport(
        reason,
        targetUserId,
        reporterUserId,
      );
    } catch (error) {
      console.error(`Error reporting user ${targetUserId}:`, error);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_USER);
    }
  }
}
