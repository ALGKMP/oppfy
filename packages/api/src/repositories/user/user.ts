import { and, eq, inArray, or, sql } from "drizzle-orm"; // Add inArray import

import { db, schema } from "@oppfy/db";
import type { InferInsertModel } from "@oppfy/db/";

import { handleDatabaseErrors } from "../../errors";

export type PrivacySettings = NonNullable<
  InferInsertModel<typeof schema.user>["privacySetting"]
>;

export class UserRepository {
  private db = db;

  @handleDatabaseErrors
  async createUser({
    userId,
    phoneNumber,
    username,
    isOnApp,
    name,
  }: {
    userId: string;
    phoneNumber: string;
    username: string;
    isOnApp: boolean;
    name?: string;
  }) {
    await this.db.transaction(async (tx) => {
      // Create an empty profile for the user
      const [profile] = await tx
        .insert(schema.profile)
        .values({ userId, username, ...(name && { name }) })
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

      // Create the user
      await tx
        .insert(schema.user)
        .values({
          id: userId,
          notificationSettingsId: notificationSetting.id,
          phoneNumber,
        });

      await tx.insert(schema.userStatus).values({ userId, isOnApp: isOnApp });
    });
  }

  @handleDatabaseErrors
  async getUser({ userId }: { userId: string }) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    });
  }

  @handleDatabaseErrors
  async getUserWithProfile({ userId }: { userId: string }) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: { profile: true },
    });
  }

  @handleDatabaseErrors
  async getUserStatus({ userId }: { userId: string }) {
    return await this.db.query.userStatus.findFirst({
      where: eq(schema.userStatus.userId, userId),
    });
  }

  @handleDatabaseErrors
  async getUserByPhoneNumber({ phoneNumber }: { phoneNumber: string }) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.phoneNumber, phoneNumber),
    });
  }

  @handleDatabaseErrors
  async deleteUser({ userId }: { userId: string }) {
    await this.db.delete(schema.user).where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async updatePrivacy({
    userId,
    newPrivacySetting,
  }: {
    userId: string;
    newPrivacySetting: PrivacySettings;
  }) {
    return await this.db
      .update(schema.user)
      .set({ privacySetting: newPrivacySetting })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async getRandomActiveProfilesForRecs({
    userId,
    limit,
  }: {
    userId: string;
    limit: number;
  }) {
    return await this.db
      .select({ userId: schema.user.id })
      .from(schema.user)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  @handleDatabaseErrors
  async existingPhoneNumbers({ phoneNumbers }: { phoneNumbers: string[] }) {
    const existingNumbers = await this.db
      .select({ phoneNumber: schema.user.phoneNumber })
      .from(schema.user)
      .innerJoin(
        schema.userStatus,
        eq(schema.user.id, schema.userStatus.userId),
      )
      .where(
        and(
          inArray(schema.user.phoneNumber, phoneNumbers),
          eq(schema.userStatus.isOnApp, true),
        ),
      );

    return existingNumbers.map((user) => user.phoneNumber);
  }

  @handleDatabaseErrors
  async updateStatsOnUserDelete({ userId }: { userId: string }) {
    console.log("running this bitch ass hoe");
    return await this.db.transaction(async (tx) => {
      // Update post stats
      // Decrement likes count
      await tx
        .update(schema.postStats)
        .set({ likes: sql`${schema.postStats.likes} - 1` })
        .where(
          inArray(
            schema.postStats.postId,
            tx
              .select({ postId: schema.like.postId })
              .from(schema.like)
              .where(eq(schema.like.userId, userId)),
          ),
        );

      // Decrement comments count
      await tx
        .update(schema.postStats)
        .set({ comments: sql`${schema.postStats.comments} - 1` })
        .where(
          inArray(
            schema.postStats.postId,
            tx
              .select({ postId: schema.comment.postId })
              .from(schema.comment)
              .where(eq(schema.comment.userId, userId)),
          ),
        );

      // Update profile stats
      // Decrement followers count for users that the deleted user was following
      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} - 1` })
        .where(
          inArray(
            schema.profileStats.profileId,
            tx
              .select({ profileId: schema.profile.id })
              .from(schema.follow)
              .innerJoin(
                schema.user,
                eq(schema.follow.recipientId, schema.user.id),
              )
              .where(eq(schema.follow.senderId, userId)),
          ),
        );

      // Decrement following count for users that were following the deleted user
      await tx
        .update(schema.profileStats)
        .set({ following: sql`${schema.profileStats.following} - 1` })
        .where(
          inArray(
            schema.profileStats.profileId,
            tx
              .select({ profileId: schema.profile.id })
              .from(schema.follow)
              .innerJoin(
                schema.user,
                eq(schema.follow.senderId, schema.user.id),
              )
              .where(eq(schema.follow.recipientId, userId)),
          ),
        );

      // Decrement friends count for users that were friends with the deleted user
      await tx
        .update(schema.profileStats)
        .set({ friends: sql`${schema.profileStats.friends} - 1` })
        .where(
          inArray(
            schema.profileStats.profileId,
            tx
              .select({ profileId: schema.profile.id })
              .from(schema.friend)
              .innerJoin(
                schema.user,
                or(
                  and(
                    eq(schema.friend.userIdA, userId),
                    eq(schema.friend.userIdB, schema.user.id),
                  ),
                  and(
                    eq(schema.friend.userIdB, userId),
                    eq(schema.friend.userIdA, schema.user.id),
                  ),
                ),
              ),
          ),
        );
    });
  }

  @handleDatabaseErrors
  async updateUserOnAppStatus({
    userId,
    isOnApp,
  }: {
    userId: string;
    isOnApp: boolean;
  }) {
    await this.db
      .update(schema.userStatus)
      .set({ isOnApp })
      .where(eq(schema.userStatus.userId, userId));
  }

  @handleDatabaseErrors
  async updateUserTutorialComplete({
    userId,
    hasCompletedTutorial,
  }: {
    userId: string;
    hasCompletedTutorial: boolean;
  }) {
    await this.db
      .update(schema.userStatus)
      .set({ hasCompletedTutorial })
      .where(eq(schema.userStatus.userId, userId));
  }

  @handleDatabaseErrors
  async updateUserOnboardingComplete({
    userId,
    hasCompletedOnboarding,
  }: {
    userId: string;
    hasCompletedOnboarding: boolean;
  }) {
    await this.db
      .update(schema.userStatus)
      .set({ hasCompletedOnboarding })
      .where(eq(schema.userStatus.userId, userId));
  }
}
