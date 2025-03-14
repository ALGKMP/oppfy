import { and, eq, inArray, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  PhoneNumberNotFoundError,
  UserCreationError,
  UserNotFoundError,
  UserProfileNotFoundError,
  UserStatusNotFoundError,
} from "../../errors/user.errors";
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
  ): Promise<Result<void, UserCreationError>> {
    if (db === this.db) {
      try {
        await this.db.transaction(async (trx) => {
          const result = await this.createUser(
            { userId, phoneNumber, username, isOnApp, name },
            trx,
          );

          if (result.isErr()) {
            throw result.error;
          }
        });
        return ok(undefined);
      } catch (error) {
        if (error instanceof UserCreationError) {
          return err(error);
        }
        return err(
          new UserCreationError(
            error instanceof Error ? error.message : "Unknown error",
          ),
        );
      }
    }

    // Create an empty profile for the user
    const [profile] = await db
      .insert(this.schema.profile)
      .values({ userId, username, ...(name && { name }) })
      .returning({ id: this.schema.profile.id });

    if (!profile) {
      return err(new UserCreationError("Profile was not created"));
    }

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
      return err(new UserCreationError("Profile stats was not created"));
    }

    if (notificationSetting === undefined) {
      return err(new UserCreationError("Notification setting was not created"));
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

    return ok(undefined);
  }

  async getUser(
    { userId }: GetUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<User, UserNotFoundError>> {
    const user = await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
    });

    if (!user) {
      return err(new UserNotFoundError(userId));
    }

    return ok(user);
  }

  async getUserWithProfile(
    { userId }: GetUserWithProfileParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<
    Result<UserWithProfile, UserProfileNotFoundError>
  > {
    const userWithProfile = await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
      with: { profile: true },
    });

    if (!userWithProfile) {
      return err(new UserProfileNotFoundError(userId));
    }

    return ok(userWithProfile);
  }

  async getUserStatus(
    { userId }: GetUserStatusParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<UserStatus, UserStatusNotFoundError>> {
    const userStatus = await db.query.userStatus.findFirst({
      where: eq(this.schema.userStatus.userId, userId),
    });

    if (!userStatus) {
      return err(new UserStatusNotFoundError(userId));
    }

    return ok(userStatus);
  }

  async getUserByPhoneNumber(
    { phoneNumber }: GetUserByPhoneNumberParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<User, PhoneNumberNotFoundError>> {
    const user = await db.query.user.findFirst({
      where: eq(this.schema.user.phoneNumber, phoneNumber),
    });

    if (!user) {
      return err(new PhoneNumberNotFoundError(phoneNumber));
    }

    return ok(user);
  }

  async deleteUser(
    { userId }: DeleteUserParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, UserNotFoundError>> {
    const result = await db
      .delete(this.schema.user)
      .where(eq(this.schema.user.id, userId))
      .returning({ id: this.schema.user.id });

    if (result.length === 0) {
      return err(new UserNotFoundError(userId));
    }

    return ok(undefined);
  }

  async updatePrivacy(
    { userId, newPrivacySetting }: UpdatePrivacyParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, UserNotFoundError>> {
    const result = await db
      .update(this.schema.user)
      .set({ privacySetting: newPrivacySetting })
      .where(eq(this.schema.user.id, userId))
      .returning({ id: this.schema.user.id });

    if (result.length === 0) {
      return err(new UserNotFoundError(userId));
    }

    return ok(undefined);
  }

  async getRandomActiveProfilesForRecs(
    { limit }: GetRandomActiveProfilesForRecsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<{ userId: string }[], never>> {
    const results = await db
      .select({ userId: this.schema.user.id })
      .from(this.schema.user)
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    return ok(results);
  }

  async existingPhoneNumbers(
    { phoneNumbers }: ExistingPhoneNumbersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<string[], never>> {
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

    return ok(existingNumbers.map((user) => user.phoneNumber));
  }

  async updateStatsOnUserDelete(
    { userId }: UpdateStatsOnUserDeleteParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, UserNotFoundError>> {
    if (db === this.db) {
      try {
        await this.db.transaction(async (trx) => {
          const result = await this.updateStatsOnUserDelete({ userId }, trx);

          if (result.isErr()) {
            throw result.error;
          }
        });
        return ok(undefined);
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          return err(error);
        }
        return err(new UserNotFoundError(userId));
      }
    }

    // First check if user exists
    const user = await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
    });

    if (!user) {
      return err(new UserNotFoundError(userId));
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
                eq(this.schema.friend.userIdA, this.schema.user.id),
                eq(this.schema.friend.userIdB, this.schema.user.id),
              ),
            )
            .where(
              or(
                eq(this.schema.friend.userIdA, userId),
                eq(this.schema.friend.userIdB, userId),
              ),
            ),
        ),
      );

    return ok(undefined);
  }

  async updateUserOnAppStatus(
    { userId, isOnApp }: UpdateUserOnAppStatusParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, UserNotFoundError>> {
    const result = await db
      .update(this.schema.userStatus)
      .set({ isOnApp })
      .where(eq(this.schema.userStatus.userId, userId))
      .returning({ id: this.schema.userStatus.id });

    if (result.length === 0) {
      return err(new UserNotFoundError(userId));
    }

    return ok(undefined);
  }

  async updateUserTutorialComplete(
    { userId, hasCompletedTutorial }: UpdateUserTutorialCompleteParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, UserNotFoundError>> {
    const result = await db
      .update(this.schema.userStatus)
      .set({ hasCompletedTutorial })
      .where(eq(this.schema.userStatus.userId, userId))
      .returning({ id: this.schema.userStatus.id });

    if (result.length === 0) {
      return err(new UserNotFoundError(userId));
    }

    return ok(undefined);
  }

  async updateUserOnboardingComplete(
    { userId, hasCompletedOnboarding }: UpdateUserOnboardingCompleteParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, UserNotFoundError>> {
    const result = await db
      .update(this.schema.userStatus)
      .set({ hasCompletedOnboarding })
      .where(eq(this.schema.userStatus.userId, userId))
      .returning({ id: this.schema.userStatus.id });

    if (result.length === 0) {
      return err(new UserNotFoundError(userId));
    }

    return ok(undefined);
  }
}
