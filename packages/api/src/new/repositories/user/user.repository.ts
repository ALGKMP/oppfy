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
  GetUserWithNotificationSettingsParams,
  GetUserWithProfileParams,
  IUserRepository,
  PrivacySettings,
  UpdatePrivacyParams,
  UpdateStatsOnUserDeleteParams,
  UpdateUserOnAppStatusParams,
  UpdateUserOnboardingCompleteParams,
  UpdateUserTutorialCompleteParams,
} from "../../interfaces/repositories/user/userRepository.interface";
import type {
  User,
  UserStatus,
  UserWithNotificationSettings,
  UserWithProfile,
} from "../../models";

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

  async createUser(params: CreateUserParams, tx: Transaction): Promise<void> {
    const { userId, phoneNumber, username, isOnApp, name } = params;

    // Create the user first
    await tx.insert(this.schema.user).values({
      id: userId,
      phoneNumber,
    });

    // Create profile
    const [profile] = await tx
      .insert(this.schema.profile)
      .values({ userId, username, ...(name && { name }) })
      .returning({ id: this.schema.profile.id });

    if (!profile) throw new Error("Profile was not created");

    // Create user stats
    await tx.insert(this.schema.userStats).values({ userId });

    // Create notification settings
    await tx.insert(this.schema.notificationSettings).values({ userId });

    // Create user status
    await tx.insert(this.schema.userStatus).values({ userId, isOnApp });
  }

  async getUser(
    { userId }: GetUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<User | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
    });
  }

  async getUserWithNotificationSettings(
    { userId }: GetUserWithNotificationSettingsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserWithNotificationSettings | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
      with: { notificationSettings: true },
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
    tx: Transaction,
  ): Promise<void> {
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
      .update(this.schema.userStats)
      .set({ followers: sql`${this.schema.userStats.followers} - 1` })
      .where(
        inArray(
          this.schema.userStats.profileId,
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
      .update(this.schema.userStats)
      .set({ following: sql`${this.schema.userStats.following} - 1` })
      .where(
        inArray(
          this.schema.userStats.profileId,
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
      .update(this.schema.userStats)
      .set({ friends: sql`${this.schema.userStats.friends} - 1` })
      .where(
        inArray(
          this.schema.userStats.profileId,
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
