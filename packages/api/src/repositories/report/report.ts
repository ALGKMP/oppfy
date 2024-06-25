import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { sharedValidators } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

export class ReportRepository {
  // Function to create a new report comment
  @handleDatabaseErrors
  async createCommentReport(
    reason: z.infer<typeof sharedValidators.report.reportCommentOptions>,
    commentId: number,
    userId: string,
  ) {
    const reportComment = await db.insert(schema.reportComment).values({
      reason,
      reporterUserId: userId,
      commentId,
    });

    return reportComment;
  }

  // Function to create a new report comment
  @handleDatabaseErrors
  async createPostReport(
    reason: z.infer<typeof sharedValidators.report.reportPostOptions>,
    postId: number,
    reporterUserId: string,
  ) {
    const reportComment = await db.insert(schema.reportPost).values({
      reporterUserId,
      reason,
      postId,
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
      reporterUserId,
      targetUserId,
    });

    return reportComment;
  }
}
