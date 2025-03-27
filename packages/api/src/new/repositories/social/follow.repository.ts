import { and, asc, count, eq, exists, gt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  CleanupFollowRelationshipsParams,
  IFollowRepository,
  PaginateFollowParams,
  SocialProfile,
  UserIdsParams,
} from "../../interfaces/repositories/social/follow.repository.interface";
import { Follow, FollowRequest, Profile } from "../../models";

@injectable()
export class FollowRepository implements IFollowRepository {
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
    params: UserIdsParams,
    tx: Transaction,
  ): Promise<Follow | undefined> {
    const { senderUserId, recipientUserId } = params;
    const result = await tx
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
    params: UserIdsParams,
    tx: Transaction,
  ): Promise<FollowRequest | undefined> {
    const { senderUserId, recipientUserId } = params;
    const result = await tx
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

  async createFollower(params: UserIdsParams, tx: Transaction): Promise<void> {
    const { senderUserId, recipientUserId } = params;

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

  async deleteFollower(params: UserIdsParams, tx: Transaction): Promise<void> {
    const { senderUserId, recipientUserId } = params;

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
    params: UserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderUserId, recipientUserId } = params;
    await db.insert(this.schema.followRequest).values({
      senderUserId,
      recipientUserId,
    });
  }

  async deleteFollowRequest(
    params: UserIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderUserId, recipientUserId } = params;
    await db
      .delete(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderUserId, senderUserId),
          eq(this.schema.followRequest.recipientUserId, recipientUserId),
        ),
      );
  }

  async cleanupFollowRelationships(
    params: CleanupFollowRelationshipsParams,
    tx: Transaction,
  ): Promise<void> {
    const { userIdA, userIdB } = params;

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
  }

  async paginateFollowers(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const followers = await db
      .select({
        profile: this.schema.profile,
        followedAt: this.schema.follow.createdAt,
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
      .where(
        and(
          eq(this.schema.follow.recipientUserId, userId),
          cursor
            ? or(
                gt(this.schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.follow.createdAt, cursor.createdAt),
                  gt(this.schema.user.id, cursor.userId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.follow.createdAt), asc(this.schema.user.id))
      .limit(limit);

    return followers.map((follower) => ({
      ...follower.profile,
      followedAt: follower.followedAt,
    }));
  }

  async paginateFollowing(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const following = await db
      .select({
        profile: this.schema.profile,
        followedAt: this.schema.follow.createdAt,
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
      .where(
        and(
          eq(this.schema.follow.senderUserId, userId),
          cursor
            ? or(
                gt(this.schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.follow.createdAt, cursor.createdAt),
                  gt(this.schema.user.id, cursor.userId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.follow.createdAt), asc(this.schema.user.id))
      .limit(limit);

    return following.map((following) => ({
      ...following.profile,
      followedAt: following.followedAt,
    }));
  }

  async paginateFollowRequests(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const requests = await db
      .select({
        profile: this.schema.profile,
        followedAt: this.schema.followRequest.createdAt,
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
                  gt(this.schema.user.id, cursor.userId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(this.schema.followRequest.createdAt),
        asc(this.schema.user.id),
      )
      .limit(limit);

    return requests.map((request) => ({
      ...request.profile,
      followedAt: request.followedAt,
    }));
  }
}
