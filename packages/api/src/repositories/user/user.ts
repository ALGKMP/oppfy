import { and, eq } from "drizzle-orm";

import { asc, db, gt, or, schema } from "@oppfy/db";
import type { InferInsertModel } from "@oppfy/db/";

import { handleDatabaseErrors } from "../../errors";
import { auth } from "../../utils/firebase";

export type PrivacySettings = NonNullable<
  InferInsertModel<typeof schema.user>["privacySetting"]
>;

export class UserRepository {
  private db = db;
  private auth = auth;

  @handleDatabaseErrors
  async createUser(userId: string, phoneNumber: string) {
    return await this.db.transaction(async (tx) => {
      // Create an empty profile for the user, ready to be updated later
      const profile = await tx.insert(schema.profile).values({});

      // Create default notification settings for the user
      const notificationSetting = await tx
        .insert(schema.notificationSettings)
        .values({});

      // Create the user with the profileId and notificationSettingId
      await tx.insert(schema.user).values({
        id: userId,
        profileId: profile[0].insertId,
        notificationSettingsId: notificationSetting[0].insertId,
        phoneNumber
      });
    });
  }

  @handleDatabaseErrors
  async getUser(userId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    });
  }

  @handleDatabaseErrors
  async getUserByProfileId(profileId: number) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.profileId, profileId),
    });
  }

  @handleDatabaseErrors
  async deleteUser(userId: string) {
    // TODO: This needs to handle failed states
    await this.db.delete(schema.user).where(eq(schema.user.id, userId));
    await this.auth.deleteUser(userId);
  }

  @handleDatabaseErrors
  async updatePrivacySetting(
    userId: string,
    newPrivacySetting: PrivacySettings,
  ) {
    return await this.db
      .update(schema.user)
      .set({ privacySetting: newPrivacySetting })
      .where(eq(schema.user.id, userId));
  }
}
