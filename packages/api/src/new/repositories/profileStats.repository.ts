import { eq, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../container";
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
} from "../interfaces/repositories/profileStatsRepository.interface";

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
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, amount } = params;

    await tx
      .update(this.schema.profileStats)
      .set({
        followers: sql`${this.schema.profileStats.followers} - ${amount}`,
      })
      .where(eq(this.schema.profileStats.profileId, userId));
  }

  async decrementFollowingCount(
    params: DecrementFollowingCountParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, amount } = params;

    await tx
      .update(this.schema.profileStats)
      .set({
        following: sql`${this.schema.profileStats.following} - ${amount}`,
      })
      .where(eq(this.schema.profileStats.profileId, userId));
  }

  async decrementFriendsCount(
    params: DecrementFriendsCountParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, amount } = params;

    await tx
      .update(this.schema.profileStats)
      .set({ friends: sql`${this.schema.profileStats.friends} - ${amount}` })
      .where(eq(this.schema.profileStats.profileId, userId));
  }

  async decrementPostsCount(
    params: DecrementPostsCountParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, decrementBy } = params;

    await tx
      .update(this.schema.profileStats)
      .set({ posts: sql`${this.schema.profileStats.posts} - ${decrementBy}` })
      .where(eq(this.schema.profileStats.profileId, profileId));
  }

  async incrementFollowerCount(
    params: IncrementFollowerCountParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await tx
      .update(this.schema.profileStats)
      .set({
        followers: sql`${this.schema.profileStats.followers} + ${incrementBy}`,
      })
      .where(eq(this.schema.profileStats.profileId, profileId));
  }

  async incrementFollowingCount(
    params: IncrementFollowingCountParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await tx
      .update(this.schema.profileStats)
      .set({
        following: sql`${this.schema.profileStats.following} + ${incrementBy}`,
      })
      .where(eq(this.schema.profileStats.profileId, profileId));
  }

  async incrementFriendsCount(
    params: IncrementFriendsCountParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await tx
      .update(this.schema.profileStats)
      .set({
        friends: sql`${this.schema.profileStats.friends} + ${incrementBy}`,
      })
      .where(eq(this.schema.profileStats.profileId, profileId));
  }

  async incrementPostsCount(
    params: IncrementPostsCountParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { profileId, incrementBy } = params;

    await tx
      .update(this.schema.profileStats)
      .set({ posts: sql`${this.schema.profileStats.posts} + ${incrementBy}` })
      .where(eq(this.schema.profileStats.profileId, profileId));
  }

  async getProfileStats(
    params: GetProfileStatsParams,
    tx: DatabaseOrTransaction = this.db,
  ): Promise<any> {
    const { profileId } = params;

    return await tx.query.profileStats.findFirst({
      where: eq(this.schema.profileStats.profileId, profileId),
    });
  }
}
