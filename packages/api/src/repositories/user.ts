import { eq } from "drizzle-orm";

import type { InferInsertModel } from "@acme/db";
import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";
import { auth } from "../utils/firebase";

export type PrivacySetting = InferInsertModel<
  typeof schema.user
>["privacySetting"];

export class UserRepository {
  private db = db;
  private auth = auth;

  @handleDatabaseErrors
  async createUser(userId: string) {
    await this.db.transaction(async (tx) => {
      // Create the profile for the user
      const profile = await tx.insert(schema.profile).values({}).execute();

      // Create default notification settings for the user
      const notificationSetting = await tx
        .insert(schema.notificationSettings)
        .values({})
        .execute();

      // Create the user with the profileId and notificationSettingId
      await tx.insert(schema.user).values({
        id: userId,
        profileId: profile[0].insertId,
        notificationSettingsId: notificationSetting[0].insertId,
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
  async getProfile(profileId: number) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
    });
  }

  @handleDatabaseErrors
  async addProfile(userId: string, profileId: number) {
    await this.db
      .update(schema.user)
      .set({ profileId })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async updateUsername(userId: string, username: string) {
    return await this.db
      .update(schema.user)
      .set({ username })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async usernameExists(username: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.username, username),
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
    newPrivacySetting: PrivacySetting,
  ) {
    return await this.db
      .update(schema.user)
      .set({ privacySetting: newPrivacySetting })
      .where(eq(schema.user.id, userId));
  }
}
