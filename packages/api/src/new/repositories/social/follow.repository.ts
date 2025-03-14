import { and, asc, count, eq, gt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
} from "@oppfy/db";
import { isNotNull } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  FollowNotFoundError,
  FollowRequestNotFoundError,
  ProfileNotFoundError,
} from "../../errors/social.errors";
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

// TODO: Pagination functions changed when moved to new DP

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
  ): Promise<Result<void, ProfileNotFoundError>> {
    const { senderUserId, recipientUserId } = params;

    await db
      .insert(this.schema.follow)
      .values({ recipientId: recipientUserId, senderId: senderUserId });

    const senderProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, senderUserId),
    });

    if (!senderProfile) {
      return err(new ProfileNotFoundError(senderUserId));
    }

    await db
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} + 1` })
      .where(eq(this.schema.profileStats.profileId, senderProfile.id));

    const recipientProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, recipientUserId),
    });

    if (!recipientProfile) {
      return err(new ProfileNotFoundError(recipientUserId));
    }

    await db
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} + 1` })
      .where(eq(this.schema.profileStats.profileId, recipientProfile.id));

    return ok(undefined);
  }

  async removeFollower(
    params: RemoveFollowerParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, FollowNotFoundError | ProfileNotFoundError>> {
    const { followerId, followeeId } = params;

    const result = await db
      .delete(this.schema.follow)
      .where(
        and(
          eq(this.schema.follow.senderId, followerId),
          eq(this.schema.follow.recipientId, followeeId),
        ),
      )
      .returning({ id: this.schema.follow.id });

    if (result.length === 0) {
      return err(new FollowNotFoundError());
    }

    const followerProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, followerId),
    });

    if (!followerProfile) {
      return err(new ProfileNotFoundError(followerId));
    }

    await db
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} - 1` })
      .where(eq(this.schema.profileStats.profileId, followerProfile.id));

    const followeeProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, followeeId),
    });

    if (!followeeProfile) {
      return err(new ProfileNotFoundError(followeeId));
    }

    await db
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} - 1` })
      .where(eq(this.schema.profileStats.profileId, followeeProfile.id));

    return ok(undefined);
  }

  async removeFollowRequest(
    senderId: string,
    recipientId: string,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, FollowRequestNotFoundError>> {
    const result = await db
      .delete(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, senderId),
          eq(this.schema.followRequest.recipientId, recipientId),
        ),
      )
      .returning({ id: this.schema.followRequest.id });

    if (result.length === 0) {
      return err(new FollowRequestNotFoundError());
    }

    return ok(undefined);
  }

  async getFollower(
    params: GetFollowerParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<{ id: string } | undefined, never>> {
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

    return ok(result[0]);
  }

  async countFollowers(
    params: CountFollowersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<number | undefined, never>> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.recipientId, userId));

    return ok(result[0]?.count);
  }

  async countFollowing(
    params: CountFollowingParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<number | undefined, never>> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.senderId, userId));

    return ok(result[0]?.count);
  }

  async countFollowRequests(
    params: CountFollowRequestsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<number | undefined, never>> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.followRequest)
      .where(eq(this.schema.followRequest.recipientId, userId));

    return ok(result[0]?.count);
  }

  async deleteFollowRequest(
    params: DeleteFollowRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, FollowRequestNotFoundError>> {
    const { senderId, recipientId } = params;

    const result = await db
      .delete(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, senderId),
          eq(this.schema.followRequest.recipientId, recipientId),
        ),
      )
      .returning({ id: this.schema.followRequest.id });

    if (result.length === 0) {
      return err(new FollowRequestNotFoundError());
    }

    return ok(undefined);
  }

  async createFollowRequest(
    params: CreateFollowRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, never>> {
    const { senderId, recipientId } = params;

    await db
      .insert(this.schema.followRequest)
      .values({ senderId, recipientId });

    return ok(undefined);
  }

  async getFollowRequest(
    params: GetFollowRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<{ id: string } | undefined, never>> {
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

    return ok(result[0]);
  }

  async acceptFollowRequest(
    params: AcceptFollowRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, FollowRequestNotFoundError | ProfileNotFoundError>> {
    const { senderId, recipientId } = params;

    const requestResult = await db
      .delete(this.schema.followRequest)
      .where(
        and(
          eq(this.schema.followRequest.senderId, senderId),
          eq(this.schema.followRequest.recipientId, recipientId),
        ),
      )
      .returning({ id: this.schema.followRequest.id });

    if (requestResult.length === 0) {
      return err(new FollowRequestNotFoundError());
    }

    await db.insert(this.schema.follow).values({ senderId, recipientId });

    const senderProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, senderId),
    });

    if (!senderProfile) {
      return err(new ProfileNotFoundError(senderId));
    }

    await db
      .update(this.schema.profileStats)
      .set({ following: sql`${this.schema.profileStats.following} + 1` })
      .where(eq(this.schema.profileStats.profileId, senderProfile.id));

    const recipientProfile = await db.query.profile.findFirst({
      where: eq(this.schema.profile.userId, recipientId),
    });

    if (!recipientProfile) {
      return err(new ProfileNotFoundError(recipientId));
    }

    await db
      .update(this.schema.profileStats)
      .set({ followers: sql`${this.schema.profileStats.followers} + 1` })
      .where(eq(this.schema.profileStats.profileId, recipientProfile.id));

    return ok(undefined);
  }

  async paginateFollowersSelf(
    params: PaginateFollowersSelfParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FollowerResult[], never>> {
    const { forUserId, cursor = null, pageSize = 10 } = params;

    const results = await db
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

    return ok(results);
  }

  async paginateFollowersOthers(
    params: PaginateFollowersOthersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FollowerResult[], never>> {
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

    if (followers.length === 0) return ok([]);

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

    const result = followers.map((follower) => ({
      ...follower,
      isFollowing: followingIds.has(follower.userId),
      isFollowRequested: requestedIds.has(follower.userId),
    }));

    return ok(result);
  }

  async getAllFollowingIds(
    params: GetAllFollowingIdsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<string[], never>> {
    const { forUserId } = params;

    const result = await db
      .select({ recipientId: this.schema.follow.recipientId })
      .from(this.schema.follow)
      .where(eq(this.schema.follow.senderId, forUserId));

    return ok(result.map((r) => r.recipientId));
  }

  async paginateFollowingSelf(
    params: PaginateFollowingSelfParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FollowerResult[], never>> {
    const { userId, cursor = null, pageSize = 10 } = params;

    const results = await db
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

    return ok(results);
  }

  async paginateFollowingOthers(
    params: PaginateFollowingOthersParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FollowerResult[], never>> {
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

    if (following.length === 0) return ok([]);

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

    const result = following.map((follow) => ({
      ...follow,
      isFollowing: followingIds.has(follow.userId),
      isFollowRequested: requestedIds.has(follow.userId),
    }));

    return ok(result);
  }

  async paginateFollowRequests(
    params: PaginateFollowRequestsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FollowRequestResult[], never>> {
    const { forUserId, cursor = null, pageSize = 10 } = params;

    const results = await db
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

    return ok(results);
  }
}
