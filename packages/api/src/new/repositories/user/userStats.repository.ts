import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  DecrementFollowerCountParams,
  DecrementFollowingCountParams,
  DecrementFriendsCountParams,
  DecrementPostsCountParams,
  GetUserStatsParams,
  IncrementFollowerCountParams,
  IncrementFollowingCountParams,
  IncrementFriendsCountParams,
  IncrementPostsCountParams,
  IUserStatsRepository,
} from "../../interfaces/repositories/user/profileStatsRepository.interface";
import { UserStats } from "../../models";

@injectable()
export class UserStatsRepository implements IUserStatsRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async decrementFollowerCount(
    params: DecrementFollowerCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, amount } = params;

    await db
      .update(this.schema.userStats)
      .set({
        followers: sql`${this.schema.userStats.followers} - ${amount}`,
      })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async decrementFollowingCount(
    params: DecrementFollowingCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, amount } = params;

    await db
      .update(this.schema.userStats)
      .set({
        following: sql`${this.schema.userStats.following} - ${amount}`,
      })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async decrementFriendsCount(
    params: DecrementFriendsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, amount } = params;

    await db
      .update(this.schema.userStats)
      .set({ friends: sql`${this.schema.userStats.friends} - ${amount}` })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async decrementPostsCount(
    params: DecrementPostsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, decrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({ posts: sql`${this.schema.userStats.posts} - ${decrementBy}` })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async incrementFollowerCount(
    params: IncrementFollowerCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({
        followers: sql`${this.schema.userStats.followers} + ${incrementBy}`,
      })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async incrementFollowingCount(
    params: IncrementFollowingCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({
        following: sql`${this.schema.userStats.following} + ${incrementBy}`,
      })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async incrementFriendsCount(
    params: IncrementFriendsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({
        friends: sql`${this.schema.userStats.friends} + ${incrementBy}`,
      })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async incrementPostsCount(
    params: IncrementPostsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({ posts: sql`${this.schema.userStats.posts} + ${incrementBy}` })
      .where(eq(this.schema.userStats.userId, userId));
  }

  async getUserStats(
    params: GetUserStatsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserStats | undefined> {
    const { userId } = params;

    return await db.query.userStats.findFirst({
      where: eq(this.schema.userStats.userId, userId),
    });
  }
}
