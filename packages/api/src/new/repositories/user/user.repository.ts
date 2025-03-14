import { and, eq, inArray, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
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
} from "../../interfaces/repositories/user/userRepository.interface";
import type { User, UserStatus, UserWithProfile } from "../../models";

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
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    if (db === this.db) {
      await this.db.transaction(async (trx) => {
        await this.createUser(
          { userId, phoneNumber, username, isOnApp, name },
          trx,
        );
      });
      return;
    }

    // Create an empty profile for the user
    const [profile] = await db
      .insert(this.schema.profile)
      .values({ userId, username, ...(name && { name }) })
      .returning({ id: this.schema.profile.id });

    if (!profile) throw new Error("Profile was not created");

    const [profileStats] = await db
      .insert(this.schema.profileStats)
      .values({ profileId: profile.id })
      .returning({ id: this.schema.profileStats.id });

    // Create default notification settings for the user
    const [notificationSetting] = await db
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
    await db.insert(this.schema.user).values({
      id: userId,
      notificationSettingsId: notificationSetting.id,
      phoneNumber,
    });

    await db
      .insert(this.schema.userStatus)
      .values({ userId, isOnApp: isOnApp });
  }

  async getUser(
    { userId }: GetUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<User | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
    });
  }

  async getUserWithProfile(
    { userId }: GetUserWithProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserWithProfile | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
      with: { profile: true },
    });
  }

  async getUserStatus(
    { userId }: GetUserStatusParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserStatus | undefined> {
    return await db.query.userStatus.findFirst({
      where: eq(this.schema.userStatus.userId, userId),
    });
  }

  async getUserByPhoneNumber(
    { phoneNumber }: GetUserByPhoneNumberParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<User | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.phoneNumber, phoneNumber),
    });
  }

  async deleteUser(
    { userId }: DeleteUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db.delete(this.schema.user).where(eq(this.schema.user.id, userId));
  }

  async updatePrivacy(
    { userId, newPrivacySetting }: UpdatePrivacyParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.user)
      .set({ privacySetting: newPrivacySetting })
      .where(eq(this.schema.user.id, userId));
  }

  async getRandomActiveProfilesForRecs(
    { limit }: GetRandomActiveProfilesForRecsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<{ userId: string }[]> {
    return await db
      .select({ userId: this.schema.user.id })
      .from(this.schema.user)
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async existingPhoneNumbers(
    { phoneNumbers }: ExistingPhoneNumbersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<string[]> {
    const existingNumbers = await db
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
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    if (db === this.db) {
      await this.db.transaction(async (trx) => {
        await this.updateStatsOnUserDelete({ userId }, trx);
      });
      return;
    }

    // Update post stats
    // Decrement likes count
    await db
      .update(this.schema.postStats)
      .set({ likes: sql`${this.schema.postStats.likes} - 1` })
      .where(
        inArray(
          this.schema.postStats.postId,
          db
            .select({ postId: this.schema.like.postId })
            .from(this.schema.like)
            .where(eq(this.schema.like.userId, userId)),
        ),
      );

    // Decrement comments count
    await db
      .update(this.schema.postStats)
      .set({ comments: sql`${this.schema.postStats.comments} - 1` })
      .where(
        inArray(
          this.schema.postStats.postId,
          db
            .select({ postId: this.schema.comment.postId })
            .from(this.schema.comment)
            .where(eq(this.schema.comment.userId, userId)),
        ),
      );

    // Update profile stats
    // Decrement followers count for users that the deleted user was following
    await db
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} - 1` })
      .where(
        inArray(
          this.schema.profileStats.profileId,
          db
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
    await db
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} - 1` })
      .where(
        inArray(
          this.schema.profileStats.profileId,
          db
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
    await db
      .update(this.schema.profileStats)
      .set({ friends: sql`${this.schema.profileStats.friends} - 1` })
      .where(
        inArray(
          this.schema.profileStats.profileId,
          db
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
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ isOnApp })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  async updateUserTutorialComplete(
    { userId, hasCompletedTutorial }: UpdateUserTutorialCompleteParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ hasCompletedTutorial })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  async updateUserOnboardingComplete(
    { userId, hasCompletedOnboarding }: UpdateUserOnboardingCompleteParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ hasCompletedOnboarding })
      .where(eq(this.schema.userStatus.userId, userId));
  }
}
