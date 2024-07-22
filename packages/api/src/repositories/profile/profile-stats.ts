import { eq } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class ProfileStatsRepository {
  private db = db;

  @handleDatabaseErrors
  async getProfileStatsByProfileId(profileId: number) {
    return await this.db.query.profileStats.findFirst({
      where: eq(schema.profileStats.profileId, profileId),
    });
  }

  @handleDatabaseErrors
  async getProfileStatsByUserId(userId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: {
        profile: {
          with: { postStats: true },
        },
      },
    });
  }
}
