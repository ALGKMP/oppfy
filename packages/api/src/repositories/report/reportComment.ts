import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { sharedValidators } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

export class ReportCommentRepository {
  // Function to create a new report comment
  @handleDatabaseErrors
  async createReportComment(
    reason: z.infer<typeof sharedValidators.report.reportCommentOptions>,
    commentId: number,
    userId: string,
  ){
    const reportComment = await db.insert(schema.reportComment).values({
      reason,
      reporterUserId: userId,
      commentId,
    });

    return reportComment;
  }
}

