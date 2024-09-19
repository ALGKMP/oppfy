import { eq, inArray, sql } from "drizzle-orm"; // Add inArray import

import { db, notInArray, schema } from "@oppfy/db";
import type { InferInsertModel } from "@oppfy/db/";
import { auth } from "@oppfy/firebase";

import { handleDatabaseErrors } from "../../errors";

export type PrivacySettings = NonNullable<
  InferInsertModel<typeof schema.user>["privacySetting"]
>;

export class UserRepository {
  private db = db;
  private auth = auth;

  @handleDatabaseErrors
  async createUser(userId: string, phoneNumber: string, username: string) {
    await this.db.transaction(async (tx) => {
      // Create an empty profile for the user, ready to be updated later
      const [profile] = await tx
        .insert(schema.profile)
        .values({ username })
        .returning({ id: schema.profile.id });

      if (!profile) throw new Error("Profile was not created");

      const [profileStats] = await tx
        .insert(schema.profileStats)
        .values({ profileId: profile.id })
        .returning({ id: schema.profileStats.id });

      // Create default notification settings for the user
      const [notificationSetting] = await tx
        .insert(schema.notificationSettings)
        .values({})
        .returning({ id: schema.notificationSettings.id });

      if (profileStats === undefined) {
        throw new Error("Profile stats was not created");
      }

      if (notificationSetting === undefined) {
        throw new Error("Notification setting was not created");
      }

      // Create the user with the profileId and notificationSettingsId
      await tx.insert(schema.user).values({
        id: userId,
        profileId: profile.id,
        notificationSettingsId: notificationSetting.id,
        phoneNumber,
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
  async getUserByProfileId(profileId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.profileId, profileId),
    });
  }

  @handleDatabaseErrors
  async getUserByPhoneNumber(phoneNumber: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.phoneNumber, phoneNumber),
    });
  }

  @handleDatabaseErrors
  async deleteUser(userId: string) {
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

  @handleDatabaseErrors
  async getRandomActiveProfilesForRecs(userId: string, limit: number) {
    return await this.db.transaction(async (tx) => {
      const following = await tx
        .select({ id: schema.follower.recipientId })
        .from(schema.follower)
        .where(eq(schema.follower.senderId, userId));

      const followRequests = await tx
        .select({ id: schema.followRequest.recipientId })
        .from(schema.followRequest)
        .where(eq(schema.followRequest.senderId, userId));

      const friendRequests = await tx
        .select({ id: schema.friendRequest.recipientId })
        .from(schema.friendRequest)
        .where(eq(schema.friendRequest.senderId, userId));

      const excludeIds = [
        userId,
        ...following.map((f) => f.id),
        ...followRequests.map((fr) => fr.id),
        ...friendRequests.map((fr) => fr.id),
      ];

      return await tx
        .select({
          userId: schema.user.id,
        })
        .from(schema.user)
        .where(notInArray(schema.user.id, excludeIds))
        .orderBy(sql`RANDOM()`)
        .limit(limit);
    });
  }
}
