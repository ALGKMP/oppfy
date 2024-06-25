import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { sharedValidators } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

export class ReportUserRepository {

  // Function to create a new report comment
  @handleDatabaseErrors
  async createReportUser(
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
