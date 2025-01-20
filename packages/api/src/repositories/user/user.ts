import { and, eq, inArray, or, sql } from "drizzle-orm"; // Add inArray import

import { db, schema } from "@oppfy/db";
import type { InferInsertModel } from "@oppfy/db/";
import { auth } from "@oppfy/firebase";

import { handleDatabaseErrors } from "../../errors";
import { accountStatusEnum } from "../../../../db/src/schema";
import { InferEnum } from "../../services/user/user";

export type PrivacySettings = NonNullable<
  InferInsertModel<typeof schema.user>["privacySetting"]
>;

export class UserRepository {
  private db = db;
  private auth = auth;

  @handleDatabaseErrors
  async createUser(
    userId: string,
    phoneNumber: string,
    username: string,
    accountStatus: InferEnum<typeof accountStatusEnum>,
  ) {
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
        accountStatus,
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
    return await this.db
      .select({
        userId: schema.user.id,
      })
      .from(schema.user)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  @handleDatabaseErrors
  async existingPhoneNumbers(phoneNumbers: string[]) {
    const existingNumbers = await this.db
      .select({ phoneNumber: schema.user.phoneNumber })
      .from(schema.user)
      .where(
        and(
          inArray(schema.user.phoneNumber, phoneNumbers),
          eq(schema.user.accountStatus, "onApp"),
        ),
      );

    return existingNumbers.map((user) => user.phoneNumber);
  }

  @handleDatabaseErrors
  async updateStatsOnUserDelete(userId: string) {
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

      // Decrement views count
      const viewCounts = await tx
        .select({
          postId: schema.postView.postId,
          viewCount: sql<number>`count(*)`.as("viewCount"),
        })
        .from(schema.postView)
        .where(eq(schema.postView.userId, userId))
        .groupBy(schema.postView.postId);

      for (const { postId, viewCount } of viewCounts) {
        await tx
          .update(schema.postStats)
          .set({ views: sql`${schema.postStats.views} - ${viewCount}` })
          .where(eq(schema.postStats.postId, postId));
      }

      // Update profile stats
      // Decrement followers count for users that the deleted user was following
      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} - 1` })
        .where(
          inArray(
            schema.profileStats.profileId,
            tx
              .select({ profileId: schema.user.profileId })
              .from(schema.follower)
              .innerJoin(
                schema.user,
                eq(schema.follower.recipientId, schema.user.id),
              )
              .where(eq(schema.follower.senderId, userId)),
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
              .select({ profileId: schema.user.profileId })
              .from(schema.follower)
              .innerJoin(
                schema.user,
                eq(schema.follower.senderId, schema.user.id),
              )
              .where(eq(schema.follower.recipientId, userId)),
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
              .select({ profileId: schema.user.profileId })
              .from(schema.friend)
              .innerJoin(
                schema.user,
                or(
                  and(
                    eq(schema.friend.userId1, userId),
                    eq(schema.friend.userId2, schema.user.id),
                  ),
                  and(
                    eq(schema.friend.userId2, userId),
                    eq(schema.friend.userId1, schema.user.id),
                  ),
                ),
              ),
          ),
        );
    });
  }
}
