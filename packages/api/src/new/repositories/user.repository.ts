import { and, eq, inArray, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../container";
import type {
  CreateUserParams,
  DeleteUserParams,
  ExistingPhoneNumbersParams,
  GetRandomActiveProfilesForRecsParams,
  GetUserByPhoneNumberParams,
  GetUserParams,
  GetUserStatusParams,
  GetUserWithProfileParams,
  IUserRepository,
  PrivacySettings,
  UpdatePrivacyParams,
  UpdateStatsOnUserDeleteParams,
  UpdateUserOnAppStatusParams,
  UpdateUserOnboardingCompleteParams,
  UpdateUserTutorialCompleteParams,
} from "../interfaces/repositories/userRepository.interface";

@injectable()
export class UserRepository implements IUserRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async createUser(
    { userId, phoneNumber, username, isOnApp, name }: CreateUserParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    if (tx === this.db) {
      await this.db.transaction(async (trx) => {
        await this.createUser(
          { userId, phoneNumber, username, isOnApp, name },
          trx,
        );
      });
      return;
    }

    // Create an empty profile for the user
    const [profile] = await tx
      .insert(this.schema.profile)
      .values({ userId, username, ...(name && { name }) })
      .returning({ id: this.schema.profile.id });

    if (!profile) throw new Error("Profile was not created");

    const [profileStats] = await tx
      .insert(this.schema.profileStats)
      .values({ profileId: profile.id })
      .returning({ id: this.schema.profileStats.id });

    // Create default notification settings for the user
    const [notificationSetting] = await tx
      .insert(this.schema.notificationSettings)
      .values({})
      .returning({ id: this.schema.notificationSettings.id });

    if (profileStats === undefined) {
      throw new Error("Profile stats was not created");
    }

    if (notificationSetting === undefined) {
      throw new Error("Notification setting was not created");
    }

    // Create the user
    await tx.insert(this.schema.user).values({
      id: userId,
      notificationSettingsId: notificationSetting.id,
      phoneNumber,
    });

    await tx
      .insert(this.schema.userStatus)
      .values({ userId, isOnApp: isOnApp });
  }

  async getUser(
    { userId }: GetUserParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    return await tx.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
    });
  }

  async getUserWithProfile(
    { userId }: GetUserWithProfileParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    return await tx.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
      with: { profile: true },
    });
  }

  async getUserStatus(
    { userId }: GetUserStatusParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    return await tx.query.userStatus.findFirst({
      where: eq(this.schema.userStatus.userId, userId),
    });
  }

  async getUserByPhoneNumber(
    { phoneNumber }: GetUserByPhoneNumberParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    return await tx.query.user.findFirst({
      where: eq(this.schema.user.phoneNumber, phoneNumber),
    });
  }

  async deleteUser(
    { userId }: DeleteUserParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx.delete(this.schema.user).where(eq(this.schema.user.id, userId));
  }

  async updatePrivacy(
    { userId, newPrivacySetting }: UpdatePrivacyParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    return await tx
      .update(this.schema.user)
      .set({ privacySetting: newPrivacySetting })
      .where(eq(this.schema.user.id, userId));
  }

  async getRandomActiveProfilesForRecs(
    { userId, limit }: GetRandomActiveProfilesForRecsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<any[]> {
    return await tx
      .select({ userId: this.schema.user.id })
      .from(this.schema.user)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async existingPhoneNumbers(
    { phoneNumbers }: ExistingPhoneNumbersParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<string[]> {
    const existingNumbers = await tx
      .select({ phoneNumber: this.schema.user.phoneNumber })
      .from(this.schema.user)
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.user.id, this.schema.userStatus.userId),
      )
      .where(
        and(
          inArray(this.schema.user.phoneNumber, phoneNumbers),
          eq(this.schema.userStatus.isOnApp, true),
        ),
      );

    return existingNumbers.map((user) => user.phoneNumber);
  }

  async updateStatsOnUserDelete(
    { userId }: UpdateStatsOnUserDeleteParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    if (tx === this.db) {
      await this.db.transaction(async (trx) => {
        await this.updateStatsOnUserDelete({ userId }, trx);
      });
      return;
    }

    // Update post stats
    // Decrement likes count
    await tx
      .update(this.schema.postStats)
      .set({ likes: sql`${this.schema.postStats.likes} - 1` })
      .where(
        inArray(
          this.schema.postStats.postId,
          tx
            .select({ postId: this.schema.like.postId })
            .from(this.schema.like)
            .where(eq(this.schema.like.userId, userId)),
        ),
      );

    // Decrement comments count
    await tx
      .update(this.schema.postStats)
      .set({ comments: sql`${this.schema.postStats.comments} - 1` })
      .where(
        inArray(
          this.schema.postStats.postId,
          tx
            .select({ postId: this.schema.comment.postId })
            .from(this.schema.comment)
            .where(eq(this.schema.comment.userId, userId)),
        ),
      );

    // Update profile stats
    // Decrement followers count for users that the deleted user was following
    await tx
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} - 1` })
      .where(
        inArray(
          this.schema.profileStats.profileId,
          tx
            .select({ profileId: this.schema.profile.id })
            .from(this.schema.follow)
            .innerJoin(
              this.schema.user,
              eq(this.schema.follow.recipientId, this.schema.user.id),
            )
            .where(eq(this.schema.follow.senderId, userId)),
        ),
      );

    // Decrement following count for users that were following the deleted user
    await tx
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} - 1` })
      .where(
        inArray(
          this.schema.profileStats.profileId,
          tx
            .select({ profileId: this.schema.profile.id })
            .from(this.schema.follow)
            .innerJoin(
              this.schema.user,
              eq(this.schema.follow.senderId, this.schema.user.id),
            )
            .where(eq(this.schema.follow.recipientId, userId)),
        ),
      );

    // Decrement friends count for users that were friends with the deleted user
    await tx
      .update(this.schema.profileStats)
      .set({ friends: sql`${this.schema.profileStats.friends} - 1` })
      .where(
        inArray(
          this.schema.profileStats.profileId,
          tx
            .select({ profileId: this.schema.profile.id })
            .from(this.schema.friend)
            .innerJoin(
              this.schema.user,
              or(
                and(
                  eq(this.schema.friend.userIdA, userId),
                  eq(this.schema.friend.userIdB, this.schema.user.id),
                ),
                and(
                  eq(this.schema.friend.userIdB, userId),
                  eq(this.schema.friend.userIdA, this.schema.user.id),
                ),
              ),
            ),
        ),
      );
  }

  async updateUserOnAppStatus(
    { userId, isOnApp }: UpdateUserOnAppStatusParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx
      .update(this.schema.userStatus)
      .set({ isOnApp })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  async updateUserTutorialComplete(
    { userId, hasCompletedTutorial }: UpdateUserTutorialCompleteParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx
      .update(this.schema.userStatus)
      .set({ hasCompletedTutorial })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  async updateUserOnboardingComplete(
    { userId, hasCompletedOnboarding }: UpdateUserOnboardingCompleteParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await tx
      .update(this.schema.userStatus)
      .set({ hasCompletedOnboarding })
      .where(eq(this.schema.userStatus.userId, userId));
  }
}
