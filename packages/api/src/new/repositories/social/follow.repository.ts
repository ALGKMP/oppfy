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
  IFollowRepository,
  PaginateFollowParams,
  UserIdParams,
} from "../../interfaces/repositories/social/follow.repository.interface";
import { Profile } from "../../models";

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

  async createFollower(params: FollowParams, tx: Transaction): Promise<void> {
    const { senderId, recipientId } = params;

    // Insert the follow relationship
    await tx.insert(this.schema.follow).values({
      senderId,
      recipientId,
    });

    // Increment follower's following count in userStats
    await tx
      .update(this.schema.userStats)
      .set({ following: sql`${this.schema.userStats.following} + 1` })
      .where(eq(this.schema.userStats.userId, senderId));

    // Increment followee's followers count in userStats
    await tx
      .update(this.schema.userStats)
      .set({ followers: sql`${this.schema.userStats.followers} + 1` })
      .where(eq(this.schema.userStats.userId, recipientId));
  }

  async removeFollower(params: FollowParams, tx: Transaction): Promise<void> {
    const { senderId, recipientId } = params;

    // Delete the follow relationship
    await tx
      .delete(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderId, senderId),
          eq(this.schema.follow.recipientId, recipientId),
        ),
      );

    // Decrement follower's following count
    await tx
      .update(this.schema.userStats)
      .set({ following: sql`${this.schema.userStats.following} - 1` })
      .where(eq(this.schema.userStats.userId, senderId));

    // Decrement followee's followers count
    await tx
      .update(this.schema.userStats)
      .set({ followers: sql`${this.schema.userStats.followers} - 1` })
      .where(eq(this.schema.userStats.userId, recipientId));
  }

  async createFollowRequest(
    params: FollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderId, recipientId } = params;
    await db.insert(this.schema.followRequest).values({
      senderId,
      recipientId,
    });
  }

  async deleteFollowRequest(
    params: FollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderId, recipientId } = params;
    await db
      .delete(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, senderId),
          eq(this.schema.followRequest.recipientId, recipientId),
        ),
      );
  }

  async isFollowing(
    params: FollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<boolean> {
    const { senderId, recipientId } = params;
    const result = await db
      .select({ id: this.schema.follow.id })
      .from(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderId, senderId),
          eq(this.schema.follow.recipientId, recipientId),
        ),
      )
      .limit(1);
    return result.length > 0;
  }

  async isFollowRequested(
    params: FollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<boolean> {
    const { senderId, recipientId } = params;
    const result = await db
      .select({ id: this.schema.followRequest.id })
      .from(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, senderId),
          eq(this.schema.followRequest.recipientId, recipientId),
        ),
      )
      .limit(1);
    return result.length > 0;
  }

  async countFollowers(
    params: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
    const { userId } = params;
    const result = await db
      .select({ count: count() })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.recipientId, userId));
    return result[0]?.count ?? 0;
  }

  async countFollowing(
    params: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
    const { userId } = params;
    const result = await db
      .select({ count: count() })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.senderId, userId));
    return result[0]?.count ?? 0;
  }

  async countFollowRequests(
    params: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
    const { userId } = params;
    const result = await db
      .select({ count: count() })
      .from(this.schema.followRequest)
      .where(eq(this.schema.followRequest.recipientId, userId));
    return result[0]?.count ?? 0;
  }

  async paginateFollowers(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const followers = await db
      .select()
      .from(this.schema.follow)
      .innerJoin(
        this.schema.user,
        eq(this.schema.follow.senderId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.follow.recipientId, userId),
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

    return followers.map((result) => result.profile);
  }

  async paginateFollowing(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const following = await db
      .select()
      .from(this.schema.follow)
      .innerJoin(
        this.schema.user,
        eq(this.schema.follow.recipientId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.follow.senderId, userId),
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

    return following.map((result) => result.profile);
  }

  async paginateFollowRequests(
    params: PaginateFollowParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile[]> {
    const { otherUserId: userId, cursor, limit = 10 } = params;

    const requests = await db
      .select({
        profile: this.schema.profile,
      })
      .from(this.schema.followRequest)
      .innerJoin(
        this.schema.user,
        eq(this.schema.followRequest.senderId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.followRequest.recipientId, userId),
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

    return requests.map((result) => result.profile);
  }
}
