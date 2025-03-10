import { eq, sql } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

export class ProfileStatsRepository {
  async decrementFollowerCount({
    userId,
    amount,
  }: {
    userId: string;
    amount: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({ followers: sql`${schema.profileStats.followers} - ${amount}` })
      .where(eq(schema.profileStats.profileId, userId));
  }

  async decrementFollowingCount({
    userId,
    amount,
  }: {
    userId: string;
    amount: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({ following: sql`${schema.profileStats.following} - ${amount}` })
      .where(eq(schema.profileStats.profileId, userId));
  }

  async decrementFriendsCount({
    userId,
    amount,
  }: {
    userId: string;
    amount: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({ friends: sql`${schema.profileStats.friends} - ${amount}` })
      .where(eq(schema.profileStats.profileId, userId));
  }

  async decrementPostsCount({
    profileId,
    decrementBy,
  }: {
    profileId: string;
    decrementBy: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({ posts: sql`${schema.profileStats.posts} - ${decrementBy}` })
      .where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementFollowerCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({
        followers: sql`${schema.profileStats.followers} + ${incrementBy}`,
      })
      .where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementFollowingCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({
        following: sql`${schema.profileStats.following} + ${incrementBy}`,
      })
      .where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementFriendsCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({ friends: sql`${schema.profileStats.friends} + ${incrementBy}` })
      .where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementPostsCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.profileStats)
      .set({ posts: sql`${schema.profileStats.posts} + ${incrementBy}` })
      .where(eq(schema.profileStats.profileId, profileId));
  }

  async getProfileStats({ profileId }: { profileId: string }) {
    return await db.query.profileStats.findFirst({
      where: eq(schema.profileStats.profileId, profileId),
    });
  }
}
