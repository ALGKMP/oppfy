import { and, asc, count, eq, gt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  FollowParams,
  GetFollowParams,
  GetFollowRequestParams,
  IFollowRepository,
  PaginateFollowParams,
  SocialProfile,
  UserIdParams,
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
    params: GetFollowParams,
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
    params: GetFollowRequestParams,
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

  async createFollower(params: FollowParams, tx: Transaction): Promise<void> {
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

  async deleteFollower(params: FollowParams, tx: Transaction): Promise<void> {
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
    params: FollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderUserId, recipientUserId } = params;
    await db.insert(this.schema.followRequest).values({
      senderUserId,
      recipientUserId,
    });
  }

  async deleteFollowRequest(
    params: FollowParams,
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

  async paginateFollowers(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const followers = await db
      .select({
        profile: this.schema.profile,
        createdAt: this.schema.follow.createdAt,
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

    return followers;
  }

  async paginateFollowing(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const following = await db
      .select({
        profile: this.schema.profile,
        createdAt: this.schema.follow.createdAt,
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

    return following;
  }

  async paginateFollowRequests(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const requests = await db
      .select({
        profile: this.schema.profile,
        createdAt: this.schema.followRequest.createdAt,
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

    return requests;
  }
}
