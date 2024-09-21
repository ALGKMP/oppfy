import { db } from "@oppfy/db";
import { schema } from "@oppfy/db";

import { eq, sql } from "drizzle-orm";

export class ProfileStatsRepository {
  async decrementFollowerCount(profileId: string, decrementBy: number) {
    await db.update(schema.profileStats).set({ followers: sql`${schema.profileStats.followers} - ${decrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async decrementFollowingCount(profileId: string, decrementBy: number) {
    await db.update(schema.profileStats).set({ following: sql`${schema.profileStats.following} - ${decrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async decrementFriendsCount(profileId: string, decrementBy: number) {
    await db.update(schema.profileStats).set({ friends: sql`${schema.profileStats.friends} - ${decrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async decrementPostsCount(profileId: string, decrementBy: number) {
    await db.update(schema.profileStats).set({ posts: sql`${schema.profileStats.posts} - ${decrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async decrementViewsCount(profileId: string, decrementBy: number) {
    await db.update(schema.profileStats).set({ views: sql`${schema.profileStats.views} - ${decrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementFollowerCount(profileId: string, incrementBy: number) {
    await db.update(schema.profileStats).set({ followers: sql`${schema.profileStats.followers} + ${incrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementFollowingCount(profileId: string, incrementBy: number) {
    await db.update(schema.profileStats).set({ following: sql`${schema.profileStats.following} + ${incrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementFriendsCount(profileId: string, incrementBy: number) {
    await db.update(schema.profileStats).set({ friends: sql`${schema.profileStats.friends} + ${incrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementPostsCount(profileId: string, incrementBy: number) {
    await db.update(schema.profileStats).set({ posts: sql`${schema.profileStats.posts} + ${incrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async incrementViewsCount(profileId: string, incrementBy: number) {
    await db.update(schema.profileStats).set({ views: sql`${schema.profileStats.views} + ${incrementBy}` }).where(eq(schema.profileStats.profileId, profileId));
  }

  async getProfileStats(profileId: string) {
    return await db.query.profileStats.findFirst({
      where: eq(schema.profileStats.profileId, profileId),
    });
  }
}