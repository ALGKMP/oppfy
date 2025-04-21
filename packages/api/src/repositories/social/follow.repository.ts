import { and, asc, eq, exists, gt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import {
  FollowStatus,
  getFollowStatusSql,
  onboardingCompletedCondition,
} from "@oppfy/db/utils/query-helpers";

import type { Follow, FollowRequest, Profile } from "../../models";
import { TYPES } from "../../symbols";
import type {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
  PaginationParams,
} from "../../types";

export interface PaginateFollowParams extends PaginationParams {
  selfUserId: string;
  userId: string;
}

interface PaginateFollowRequestsParams extends PaginationParams {
  userId: string;
}

@injectable()
export class FollowRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async getFollower(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Follow | undefined> {
    const result = await db
      .select()
      .from(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderUserId, senderUserId),
          eq(this.schema.follow.recipientUserId, recipientUserId),
        ),
      );
    return result[0];
  }

  async getFollowRequest(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<FollowRequest | undefined> {
    const result = await db
      .select()
      .from(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderUserId, senderUserId),
          eq(this.schema.followRequest.recipientUserId, recipientUserId),
        ),
      );
    return result[0];
  }

  async createFollower(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void> {
    // Insert the follow relationship
    await tx.insert(this.schema.follow).values({
      senderUserId,
      recipientUserId,
    });

    // Increment follower's following count in userStats
    await tx
      .update(this.schema.userStats)
      .set({ following: sql`${this.schema.userStats.following} + 1` })
      .where(eq(this.schema.userStats.userId, senderUserId));

    // Increment followee's followers count in userStats
    await tx
      .update(this.schema.userStats)
      .set({ followers: sql`${this.schema.userStats.followers} + 1` })
      .where(eq(this.schema.userStats.userId, recipientUserId));
  }

  async deleteFollower(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void> {
    // Delete the follow relationship
    await tx
      .delete(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderUserId, senderUserId),
          eq(this.schema.follow.recipientUserId, recipientUserId),
        ),
      );

    // Decrement follower's following count
    await tx
      .update(this.schema.userStats)
      .set({ following: sql`${this.schema.userStats.following} - 1` })
      .where(eq(this.schema.userStats.userId, senderUserId));

    // Decrement followee's followers count
    await tx
      .update(this.schema.userStats)
      .set({ followers: sql`${this.schema.userStats.followers} - 1` })
      .where(eq(this.schema.userStats.userId, recipientUserId));
  }

  async createFollowRequest(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void> {
    await tx.insert(this.schema.followRequest).values({
      senderUserId,
      recipientUserId,
    });
    await tx
      .update(this.schema.userStats)
      .set({ followRequests: sql`${this.schema.userStats.followRequests} + 1` })
      .where(eq(this.schema.userStats.userId, recipientUserId));
  }

  async deleteFollowRequest(
    { senderUserId, recipientUserId }: DirectionalUserIdsParams,
    tx: Transaction,
  ): Promise<void> {
    await tx
      .delete(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderUserId, senderUserId),
          eq(this.schema.followRequest.recipientUserId, recipientUserId),
        ),
      );
    await tx
      .update(this.schema.userStats)
      .set({ followRequests: sql`${this.schema.userStats.followRequests} - 1` })
      .where(eq(this.schema.userStats.userId, recipientUserId));
  }

  async cleanupFollowRelationships(
    { userIdA, userIdB }: BidirectionalUserIdsparams,
    tx: Transaction,
  ): Promise<void> {
    await Promise.all([
      // Remove follow relationships: userIdA -> userIdB and userIdB -> userIdA
      tx
        .delete(this.schema.follow)
        .where(
          or(
            and(
              eq(this.schema.follow.senderUserId, userIdA),
              eq(this.schema.follow.recipientUserId, userIdB),
            ),
            and(
              eq(this.schema.follow.senderUserId, userIdB),
              eq(this.schema.follow.recipientUserId, userIdA),
            ),
          ),
        ),

      // Delete follow requests: userIdA -> userIdB and userIdB -> userIdA
      tx
        .delete(this.schema.followRequest)
        .where(
          or(
            and(
              eq(this.schema.followRequest.senderUserId, userIdA),
              eq(this.schema.followRequest.recipientUserId, userIdB),
            ),
            and(
              eq(this.schema.followRequest.senderUserId, userIdB),
              eq(this.schema.followRequest.recipientUserId, userIdA),
            ),
          ),
        ),

      // Update userStats for userIdA: decrement following if they followed userIdB
      tx
        .update(this.schema.userStats)
        .set({ following: sql`${this.schema.userStats.following} - 1` })
        .where(
          and(
            eq(this.schema.userStats.userId, userIdA),
            exists(
              tx
                .select()
                .from(this.schema.follow)
                .where(
                  and(
                    eq(this.schema.follow.senderUserId, userIdA),
                    eq(this.schema.follow.recipientUserId, userIdB),
                  ),
                ),
            ),
          ),
        ),

      // Update userStats for userIdB: decrement followers if userIdA was following them
      tx
        .update(this.schema.userStats)
        .set({ followers: sql`${this.schema.userStats.followers} - 1` })
        .where(
          and(
            eq(this.schema.userStats.userId, userIdB),
            exists(
              tx
                .select()
                .from(this.schema.follow)
                .where(
                  and(
                    eq(this.schema.follow.senderUserId, userIdA),
                    eq(this.schema.follow.recipientUserId, userIdB),
                  ),
                ),
            ),
          ),
        ),

      // Update userStats for userIdB: decrement following if they followed userIdA
      tx
        .update(this.schema.userStats)
        .set({ following: sql`${this.schema.userStats.following} - 1` })
        .where(
          and(
            eq(this.schema.userStats.userId, userIdB),
            exists(
              tx
                .select()
                .from(this.schema.follow)
                .where(
                  and(
                    eq(this.schema.follow.senderUserId, userIdB),
                    eq(this.schema.follow.recipientUserId, userIdA),
                  ),
                ),
            ),
          ),
        ),

      // Update userStats for userIdA: decrement followers if userIdB was following them
      tx
        .update(this.schema.userStats)
        .set({ followers: sql`${this.schema.userStats.followers} - 1` })
        .where(
          and(
            eq(this.schema.userStats.userId, userIdA),
            exists(
              tx
                .select()
                .from(this.schema.follow)
                .where(
                  and(
                    eq(this.schema.follow.senderUserId, userIdB),
                    eq(this.schema.follow.recipientUserId, userIdA),
                  ),
                ),
            ),
          ),
        ),
    ]);

    // Decrement follow requests: userIdA -> userIdB and userIdB -> userIdA
    await tx
      .update(this.schema.userStats)
      .set({ followRequests: sql`${this.schema.userStats.followRequests} - 1` })
      .where(
        and(
          eq(this.schema.userStats.userId, userIdA),
          eq(this.schema.userStats.userId, userIdB),
        ),
      );
  }

  async paginateFollowers(
    { userId, cursor, pageSize = 10, selfUserId }: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<(Profile<"onboarded"> & { followStatus: FollowStatus })[]> {
    let query = db
      .select({
        profile: this.schema.profile,
        followStatus: getFollowStatusSql(selfUserId),
      })
      .from(this.schema.follow)
      .innerJoin(
        this.schema.user,
        eq(this.schema.follow.senderUserId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.userStatus.userId, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.follow.recipientUserId, userId),
          cursor
            ? or(
                gt(this.schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.follow.createdAt, cursor.createdAt),
                  gt(this.schema.profile.userId, cursor.id),
                ),
              )
            : undefined,
          onboardingCompletedCondition(this.schema.profile),
        ),
      )
      .orderBy(
        asc(this.schema.follow.createdAt),
        asc(this.schema.profile.userId),
      )
      .limit(pageSize);

    const followers = await query;

    return followers.map(({ profile, followStatus }) => ({
      ...(profile as Profile<"onboarded">),
      followStatus,
    }));
  }

  async paginateFollowing(
    { userId, cursor, pageSize = 10, selfUserId }: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<(Profile<"onboarded"> & { followStatus: FollowStatus })[]> {
    let query = db
      .select({
        profile: this.schema.profile,
        followStatus: getFollowStatusSql(selfUserId),
      })
      .from(this.schema.follow)
      .innerJoin(
        this.schema.user,
        eq(this.schema.follow.recipientUserId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.userStatus.userId, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.follow.senderUserId, userId),
          cursor
            ? or(
                gt(this.schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.follow.createdAt, cursor.createdAt),
                  gt(this.schema.profile.userId, cursor.id),
                ),
              )
            : undefined,
          onboardingCompletedCondition(this.schema.profile),
        ),
      )
      .orderBy(
        asc(this.schema.follow.createdAt),
        asc(this.schema.profile.userId),
      )
      .limit(pageSize);

    const following = await query;

    return following.map(({ profile, followStatus }) => ({
      ...(profile as Profile<"onboarded">),
      followStatus,
    }));
  }

  async paginateFollowRequests(
    { userId, cursor, pageSize = 10 }: PaginateFollowRequestsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile<"onboarded">[]> {
    let query = db
      .select({
        profile: this.schema.profile,
      })
      .from(this.schema.followRequest)
      .innerJoin(
        this.schema.user,
        eq(this.schema.followRequest.senderUserId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.followRequest.recipientUserId, userId),
          cursor
            ? or(
                gt(this.schema.followRequest.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.followRequest.createdAt, cursor.createdAt),
                  gt(this.schema.profile.userId, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(this.schema.followRequest.createdAt),
        asc(this.schema.profile.userId),
      )
      .limit(pageSize);

    const followRequests = await query;

    return followRequests.map(({ profile }) => profile as Profile<"onboarded">);
  }
}
