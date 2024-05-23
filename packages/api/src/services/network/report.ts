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
    const report = await this.reportRepository.reportPost(
      postId,
      reporterUserId,
      reason,
    );

    if (!report) {
      console.error(`Failed to report post ${postId}`);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_POST);
    }
  }

  async reportProfile(
    targetUserId: string,
    reporterUserId: string,
    reason: z.infer<typeof reportProfileOptions>,
  ) {
    const report = await this.reportRepository.reportProfile(
      targetUserId,
      reporterUserId,
      reason,
    );

    if (!report) {
      console.error(`Failed to report user ${targetUserId}`);
      throw new DomainError(ErrorCode.FAILED_TO_REPORT_USER);
    }
  }
}
