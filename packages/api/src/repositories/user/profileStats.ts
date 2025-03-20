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
      .update(schema.userStats)
      .set({ followers: sql`${schema.userStats.followers} - ${amount}` })
      .where(eq(schema.userStats.profileId, userId));
  }

  async decrementFollowingCount({
    userId,
    amount,
  }: {
    userId: string;
    amount: number;
  }) {
    await db
      .update(schema.userStats)
      .set({ following: sql`${schema.userStats.following} - ${amount}` })
      .where(eq(schema.userStats.profileId, userId));
  }

  async decrementFriendsCount({
    userId,
    amount,
  }: {
    userId: string;
    amount: number;
  }) {
    await db
      .update(schema.userStats)
      .set({ friends: sql`${schema.userStats.friends} - ${amount}` })
      .where(eq(schema.userStats.profileId, userId));
  }

  async decrementPostsCount({
    profileId,
    decrementBy,
  }: {
    profileId: string;
    decrementBy: number;
  }) {
    await db
      .update(schema.userStats)
      .set({ posts: sql`${schema.userStats.posts} - ${decrementBy}` })
      .where(eq(schema.userStats.profileId, profileId));
  }

  async incrementFollowerCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.userStats)
      .set({
        followers: sql`${schema.userStats.followers} + ${incrementBy}`,
      })
      .where(eq(schema.userStats.profileId, profileId));
  }

  async incrementFollowingCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.userStats)
      .set({
        following: sql`${schema.userStats.following} + ${incrementBy}`,
      })
      .where(eq(schema.userStats.profileId, profileId));
  }

  async incrementFriendsCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.userStats)
      .set({ friends: sql`${schema.userStats.friends} + ${incrementBy}` })
      .where(eq(schema.userStats.profileId, profileId));
  }

  async incrementPostsCount({
    profileId,
    incrementBy,
  }: {
    profileId: string;
    incrementBy: number;
  }) {
    await db
      .update(schema.userStats)
      .set({ posts: sql`${schema.userStats.posts} + ${incrementBy}` })
      .where(eq(schema.userStats.profileId, profileId));
  }

  async getProfileStats({ profileId }: { profileId: string }) {
    return await db.query.userStats.findFirst({
      where: eq(schema.userStats.profileId, profileId),
    });
  }
}
