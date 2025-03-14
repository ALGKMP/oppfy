import { and, asc, count, eq, gt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import { isNotNull } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  AcceptFollowRequestParams,
  CountFollowersParams,
  CountFollowingParams,
  CountFollowRequestsParams,
  CreateFollowerParams,
  CreateFollowRequestParams,
  DeleteFollowRequestParams,
  FollowerResult,
  FollowRequestResult,
  GetAllFollowingIdsParams,
  GetFollowerParams,
  GetFollowRequestParams,
  IFollowRepository,
  PaginateFollowersOthersParams,
  PaginateFollowersSelfParams,
  PaginateFollowingOthersParams,
  PaginateFollowingSelfParams,
  PaginateFollowRequestsParams,
  RemoveFollowerParams,
} from "../../interfaces/repositories/social/followRepository.interface";

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

  async createFollower(
    params: CreateFollowerParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderUserId, recipientUserId } = params;

    await db
      .insert(this.schema.follow)
      .values({ recipientId: recipientUserId, senderId: senderUserId });

    const senderProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, senderUserId),
    });

    if (!senderProfile) throw new Error("Sender profile not found");

    await db
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} + 1` })
      .where(eq(this.schema.profileStats.profileId, senderProfile.id));

    const recipientProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, recipientUserId),
    });

    if (!recipientProfile) throw new Error("Recipient profile not found");

    await db
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} + 1` })
      .where(eq(this.schema.profileStats.profileId, recipientProfile.id));
  }

  async removeFollower(
    params: RemoveFollowerParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { followerId, followeeId } = params;

    await db
      .delete(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderId, followerId),
          eq(this.schema.follow.recipientId, followeeId),
        ),
      );

    const followerProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, followerId),
    });

    if (!followerProfile) throw new Error("Follower profile not found");

    await db
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} - 1` })
      .where(eq(this.schema.profileStats.profileId, followerProfile.id));

    const followeeProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, followeeId),
    });

    if (!followeeProfile) throw new Error("Followee profile not found");

    await db
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} - 1` })
      .where(eq(this.schema.profileStats.profileId, followeeProfile.id));
  }

  async removeFollowRequest(
    senderId: string,
    recipientId: string,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    await db
      .delete(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, senderId),
          eq(this.schema.followRequest.recipientId, recipientId),
        ),
      );
  }

  async getFollower(
    params: GetFollowerParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<{ id: string } | undefined> {
    const { followerId, followeeId } = params;

    const result = await db
      .select({ id: this.schema.follow.id })
      .from(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderId, followerId),
          eq(this.schema.follow.recipientId, followeeId),
        ),
      )
      .limit(1);

    return result[0];
  }

  async countFollowers(
    params: CountFollowersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number | undefined> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.recipientId, userId));

    return result[0]?.count;
  }

  async countFollowing(
    params: CountFollowingParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number | undefined> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.senderId, userId));

    return result[0]?.count;
  }

  async countFollowRequests(
    params: CountFollowRequestsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number | undefined> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.followRequest)
      .where(eq(this.schema.followRequest.recipientId, userId));

    return result[0]?.count;
  }

  async deleteFollowRequest(
    params: DeleteFollowRequestParams,
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

  async createFollowRequest(
    params: CreateFollowRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { senderId, recipientId } = params;

    await db
      .insert(this.schema.followRequest)
      .values({ senderId, recipientId });
  }

  async getFollowRequest(
    params: GetFollowRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<{ id: string } | undefined> {
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

    return result[0];
  }

  async acceptFollowRequest(
    params: AcceptFollowRequestParams,
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

    await db.insert(this.schema.follow).values({ senderId, recipientId });

    const senderProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, senderId),
    });

    if (!senderProfile) throw new Error("Sender profile not found");

    await db
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} + 1` })
      .where(eq(this.schema.profileStats.profileId, senderProfile.id));

    const recipientProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, recipientId),
    });

    if (!recipientProfile) throw new Error("Recipient profile not found");

    await db
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} + 1` })
      .where(eq(this.schema.profileStats.profileId, recipientProfile.id));
  }

  async paginateFollowersSelf(
    params: PaginateFollowersSelfParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<FollowerResult[]> {
    const { forUserId, cursor = null, pageSize = 10 } = params;

    return await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.follow.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.follow,
        eq(this.schema.user.id, this.schema.follow.senderId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.follow.recipientId, forUserId),
          cursor
            ? or(
                gt(this.schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.follow.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.follow.createdAt), asc(this.schema.profile.id))
      .limit(pageSize + 1);
  }

  async paginateFollowersOthers(
    params: PaginateFollowersOthersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<FollowerResult[]> {
    const { forUserId, currentUserId, cursor = null, pageSize = 10 } = params;

    const followers = await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.follow.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.follow,
        eq(this.schema.user.id, this.schema.follow.senderId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.follow.recipientId, forUserId),
          cursor
            ? or(
                gt(this.schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.follow.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.follow.createdAt), asc(this.schema.profile.id))
      .limit(pageSize + 1);

    if (followers.length === 0) return [];

    const userIds = followers.map((follower) => follower.userId);

    const followingStatus = await db
      .select({ followingId: this.schema.follow.recipientId })
      .from(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderId, currentUserId),
          isNotNull(this.schema.follow.recipientId),
        ),
      );

    const followRequestStatus = await db
      .select({ requestedId: this.schema.followRequest.recipientId })
      .from(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, currentUserId),
          isNotNull(this.schema.followRequest.recipientId),
        ),
      );

    const followingIds = new Set(
      followingStatus.map((status) => status.followingId),
    );
    const requestedIds = new Set(
      followRequestStatus.map((status) => status.requestedId),
    );

    return followers.map((follower) => ({
      ...follower,
      isFollowing: followingIds.has(follower.userId),
      isFollowRequested: requestedIds.has(follower.userId),
    }));
  }

  async getAllFollowingIds(
    params: GetAllFollowingIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<string[]> {
    const { forUserId } = params;

    const result = await db
      .select({ recipientId: this.schema.follow.recipientId })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.senderId, forUserId));

    return result.map((r) => r.recipientId);
  }

  async paginateFollowingSelf(
    params: PaginateFollowingSelfParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<FollowerResult[]> {
    const { userId, cursor = null, pageSize = 10 } = params;

    return await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.follow.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.follow,
        eq(this.schema.user.id, this.schema.follow.recipientId),
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
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.follow.createdAt), asc(this.schema.profile.id))
      .limit(pageSize + 1);
  }

  async paginateFollowingOthers(
    params: PaginateFollowingOthersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<FollowerResult[]> {
    const { forUserId, currentUserId, cursor = null, pageSize = 10 } = params;

    const following = await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.follow.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.follow,
        eq(this.schema.user.id, this.schema.follow.recipientId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.follow.senderId, forUserId),
          cursor
            ? or(
                gt(this.schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.follow.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.follow.createdAt), asc(this.schema.profile.id))
      .limit(pageSize + 1);

    if (following.length === 0) return [];

    const userIds = following.map((follow) => follow.userId);

    const followingStatus = await db
      .select({ followingId: this.schema.follow.recipientId })
      .from(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderId, currentUserId),
          isNotNull(this.schema.follow.recipientId),
        ),
      );

    const followRequestStatus = await db
      .select({ requestedId: this.schema.followRequest.recipientId })
      .from(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, currentUserId),
          isNotNull(this.schema.followRequest.recipientId),
        ),
      );

    const followingIds = new Set(
      followingStatus.map((status) => status.followingId),
    );
    const requestedIds = new Set(
      followRequestStatus.map((status) => status.requestedId),
    );

    return following.map((follow) => ({
      ...follow,
      isFollowing: followingIds.has(follow.userId),
      isFollowRequested: requestedIds.has(follow.userId),
    }));
  }

  async paginateFollowRequests(
    params: PaginateFollowRequestsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<FollowRequestResult[]> {
    const { forUserId, cursor = null, pageSize = 10 } = params;

    return await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.followRequest.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.followRequest,
        eq(this.schema.user.id, this.schema.followRequest.senderId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.followRequest.recipientId, forUserId),
          cursor
            ? or(
                gt(this.schema.followRequest.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.followRequest.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(this.schema.followRequest.createdAt),
        asc(this.schema.profile.id),
      )
      .limit(pageSize + 1);
  }
}
