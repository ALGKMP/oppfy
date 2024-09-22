import type { z } from "zod";

import { db, schema } from "@oppfy/db";
import type { sharedValidators } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

export class ReportRepository {
  // Function to create a new report comment
  @handleDatabaseErrors
  async createCommentReport(
    reason: z.infer<typeof sharedValidators.report.reportCommentOptions>,
    commentId: string,
    reporterUserId: string,
  ) {
    const reportComment = await db.insert(schema.reportComment).values({
      reason,
      commentId,
      reporterUserId,
    });

    return reportComment;
  }

  // Function to create a new report comment
  @handleDatabaseErrors
  async createPostReport(
    reason: z.infer<typeof sharedValidators.report.reportPostOptions>,
    postId: string,
    reporterUserId: string,
  ) {
    const reportComment = await db.insert(schema.reportPost).values({
      reason,
      postId,
      reporterUserId,
    });

    return reportComment;
  }

  // Function to create a new report comment
  @handleDatabaseErrors
  async createUserReport(
    reason: z.infer<typeof sharedValidators.report.reportUserOptions>,
    targetUserId: string,
    reporterUserId: string,
  ) {
    const reportComment = await db.insert(schema.reportUser).values({
      reason,
      targetUserId,
      reporterUserId,
    });

    return reportComment;
  }
}
