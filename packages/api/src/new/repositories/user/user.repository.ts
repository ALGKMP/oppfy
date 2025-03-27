import { and, eq, inArray, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  CreateUserNotOnAppParams,
  CreateUserOnAppParams,
  ExistingPhoneNumbersParams,
  GetRandomActiveUserIdsParams,
  GetUserByPhoneNumberParams,
  IUserRepository,
  UserIdParams,
} from "../../interfaces/repositories/user/user.repository.interface";
import type { User, UserStatus } from "../../models";

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

  /** Creates a user who is on the app, inserting records into multiple tables within a transaction. */
  async createUserOnApp(
    params: CreateUserOnAppParams,
    tx: Transaction,
  ): Promise<void> {
    const { userId, phoneNumber, username } = params;

    await tx.insert(this.schema.user).values({
      id: userId,
      phoneNumber,
    });

    await tx.insert(this.schema.profile).values({
      userId,
      username,
    });

    await tx.insert(this.schema.userStats).values({ userId });

    await tx.insert(this.schema.notificationSettings).values({ userId });

    await tx.insert(this.schema.userStatus).values({
      userId,
      isOnApp: true,
    });
  }

  /** Creates a user who is not on the app, including a name, within a transaction. */
  async createUserNotOnApp(
    params: CreateUserNotOnAppParams,
    tx: Transaction,
  ): Promise<void> {
    const { userId, phoneNumber, username, name } = params;

    await tx.insert(this.schema.user).values({
      id: userId,
      phoneNumber,
    });

    await tx.insert(this.schema.profile).values({
      userId,
      username,
      name,
    });

    await tx.insert(this.schema.userStats).values({ userId });

    await tx.insert(this.schema.notificationSettings).values({ userId });

    await tx.insert(this.schema.userStatus).values({
      userId,
      isOnApp: false,
    });
  }

  /** Retrieves a user by their ID. */
  async getUser(
    { userId }: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<User | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
    });
  }

  /** Retrieves a user by their phone number. */
  async getUserByPhoneNumber(
    { phoneNumber }: GetUserByPhoneNumberParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<User | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.phoneNumber, phoneNumber),
    });
  }

  /** Fetches a list of random active user IDs, limited by the specified number. */
  async getRandomActiveUserIds(
    { limit }: GetRandomActiveUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<{ userId: string }[]> {
    return await db
      .select({ userId: this.schema.user.id })
      .from(this.schema.user)
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.user.id, this.schema.userStatus.userId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.userStatus.isOnApp, true),
          eq(this.schema.profile.privacy, "public"),
        ),
      )
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  /** Deletes a user by their ID. */
  async deleteUser(
    { userId }: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db.delete(this.schema.user).where(eq(this.schema.user.id, userId));
  }

  /** Retrieves the status of a user by their ID. */
  async getUserStatus(
    { userId }: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserStatus | undefined> {
    return await db.query.userStatus.findFirst({
      where: eq(this.schema.userStatus.userId, userId),
    });
  }

  /** Checks for existing phone numbers that are on the app. */
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

  /** Marks a user as being on the app. */
  async markUserAsOnApp(
    { userId }: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ isOnApp: true })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  /** Marks a user as having completed the tutorial. */
  async markUserAsTutorialComplete(
    { userId }: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ hasCompletedTutorial: true })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  /** Marks a user as having completed onboarding. */
  async markUserAsOnboardingComplete(
    { userId }: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ hasCompletedOnboarding: true })
      .where(eq(this.schema.userStatus.userId, userId));
  }
}
