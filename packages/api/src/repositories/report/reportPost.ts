import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { sharedValidators } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

export class ReportPostRepository {
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
}
