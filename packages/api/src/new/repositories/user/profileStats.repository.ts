import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  DecrementFollowerCountParams,
  DecrementFollowingCountParams,
  DecrementFriendsCountParams,
  DecrementPostsCountParams,
  GetProfileStatsParams,
  IncrementFollowerCountParams,
  IncrementFollowingCountParams,
  IncrementFriendsCountParams,
  IncrementPostsCountParams,
  IProfileStatsRepository,
} from "../../interfaces/repositories/user/profileStatsRepository.interface";
import { UserStats } from "../../models";

@injectable()
export class ProfileStatsRepository implements IProfileStatsRepository {
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
      .where(eq(this.schema.userStats.profileId, userId));
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
      .where(eq(this.schema.userStats.profileId, userId));
  }

  async decrementFriendsCount(
    params: DecrementFriendsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, amount } = params;

    await db
      .update(this.schema.userStats)
      .set({ friends: sql`${this.schema.userStats.friends} - ${amount}` })
      .where(eq(this.schema.userStats.profileId, userId));
  }

  async decrementPostsCount(
    params: DecrementPostsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, decrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({ posts: sql`${this.schema.userStats.posts} - ${decrementBy}` })
      .where(eq(this.schema.userStats.profileId, profileId));
  }

  async incrementFollowerCount(
    params: IncrementFollowerCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({
        followers: sql`${this.schema.userStats.followers} + ${incrementBy}`,
      })
      .where(eq(this.schema.userStats.profileId, profileId));
  }

  async incrementFollowingCount(
    params: IncrementFollowingCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({
        following: sql`${this.schema.userStats.following} + ${incrementBy}`,
      })
      .where(eq(this.schema.userStats.profileId, profileId));
  }

  async incrementFriendsCount(
    params: IncrementFriendsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({
        friends: sql`${this.schema.userStats.friends} + ${incrementBy}`,
      })
      .where(eq(this.schema.userStats.profileId, profileId));
  }

  async incrementPostsCount(
    params: IncrementPostsCountParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await db
      .update(this.schema.userStats)
      .set({ posts: sql`${this.schema.userStats.posts} + ${incrementBy}` })
      .where(eq(this.schema.userStats.profileId, profileId));
  }

  async getProfileStats(
    params: GetProfileStatsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<UserStats | undefined> {
    const { profileId } = params;

    return await db.query.userStats.findFirst({
      where: eq(this.schema.userStats.profileId, profileId),
    });
  }
}
