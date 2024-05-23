import { and, asc, count, eq, gt, or } from "drizzle-orm";
import { z } from "zod";

import { db, schema } from "@oppfy/db";
import { reportPostOptions, reportProfileOptions } from "@oppfy/validators";

import { handleDatabaseErrors } from "../../errors";

export class ReportRepository {
  private db = db;

  @handleDatabaseErrors
  async reportPost(
    postId: number,
    reporterUserId: string,
    reportOption: z.infer<typeof reportPostOptions>,
  ) {
    return await this.db.transaction(async (tx) => {
      return await tx
        .insert(schema.reportPost)
        .values({ postId, reporterUserId, reason: reportOption });
    });
  }

  @handleDatabaseErrors
  async reportProfile(
    targetUserId: string,
    reporterUserId: string,
    reportOption: z.infer<typeof reportProfileOptions>,
  ) {
    return await this.db.transaction(async (tx) => {
      return await tx
        .insert(schema.reportProfile)
        .values({ targetUserId, reporterUserId, reason: reportOption });
    });
  }
}
