import { and, eq, inArray, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import type { PhoneNumberParam, UserIdParam } from "../../interfaces/types";
import type { User, UserStatus } from "../../models";
import { TYPES } from "../../symbols";

export interface CreateUserParams {
  id?: string;
  phoneNumber: string;
  isOnApp?: boolean;
}

export interface GetRandomActiveUserIdsParams {
  pageSize?: number;
}

export interface ExistingPhoneNumbersParams {
  phoneNumbers: string[];
}

@injectable()
export class UserRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async getUser(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<User | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.id, userId),
    });
  }

  async getUserByPhoneNumber(
    { phoneNumber }: PhoneNumberParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<User | undefined> {
    return await db.query.user.findFirst({
      where: eq(this.schema.user.phoneNumber, phoneNumber),
    });
  }

  async getRandomActiveUserIds(
    { pageSize = 10 }: GetRandomActiveUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<{ userId: string }[]> {
    return await db
      .select({ userId: this.schema.user.id })
      .from(this.schema.user)
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.user.id, this.schema.userStatus.userId),
      )
      .where(eq(this.schema.userStatus.isOnApp, true))
      .orderBy(sql`RANDOM()`)
      .limit(pageSize);
  }

  async getUserStatus(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserStatus | undefined> {
    return await db.query.userStatus.findFirst({
      where: eq(this.schema.userStatus.userId, userId),
    });
  }

  async createUser(
    { id = crypto.randomUUID(), phoneNumber, isOnApp = true }: CreateUserParams,
    tx: Transaction,
  ): Promise<void> {
    await tx
      .insert(this.schema.user)
      .values({
        id,
        phoneNumber,
      })
      .returning();

    await tx.insert(this.schema.profile).values({
      userId: id,
    });

    await tx.insert(this.schema.notificationSettings).values({ userId: id });
    await tx.insert(this.schema.userStats).values({ userId: id });
    await tx.insert(this.schema.userStatus).values({
      userId: id,
      isOnApp,
    });
  }
  async deleteUser(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db.delete(this.schema.user).where(eq(this.schema.user.id, userId));
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

  async markUserAsOnApp(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ isOnApp: true })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  async markUserAsTutorialComplete(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ hasCompletedTutorial: true })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  async markUserAsOnboardingComplete(
    { userId }: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ hasCompletedOnboarding: true })
      .where(eq(this.schema.userStatus.userId, userId));
  }

  async updateUserOnAppStatus(
    { userId, isOnApp }: { userId: string; isOnApp: boolean },
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .update(this.schema.userStatus)
      .set({ isOnApp })
      .where(eq(this.schema.userStatus.userId, userId));
  }
}
