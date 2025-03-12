import { and, asc, count, eq, gt, not, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database, DatabaseOrTransaction, Schema } from "@oppfy/db";
import { isNotNull } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  FriendRequestNotFoundError,
  FriendshipNotFoundError,
  ProfileNotFoundError,
} from "../../errors/social.errors";
import {
  CountFriendRequestsParams,
  CountFriendsParams,
  CreateFriendParams,
  CreateFriendRequestParams,
  DeleteFriendRequestParams,
  FriendRequestResult,
  FriendResult,
  FriendshipExistsParams,
  GetFriendRequestParams,
  GetFriendshipParams,
  IFriendRepository,
  PaginateFriendRequestsParams,
  PaginateFriendsOtherParams,
  PaginateFriendsSelfParams,
  RemoveFriendParams,
} from "../../interfaces/repositories/social/friendRepository.interface";

@injectable()
export class FriendRepository implements IFriendRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

  async createFriend(
    params: CreateFriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, ProfileNotFoundError>> {
    const { senderId, recipientId } = params;

    // Create friend relationship, ensuring userIdA < userIdB
    const [userIdA, userIdB] =
      senderId < recipientId
        ? [senderId, recipientId]
        : [recipientId, senderId];

    await db.insert(this.schema.friend).values([{ userIdA, userIdB }]);

    // Delete the friend request
    await db
      .delete(this.schema.friendRequest)
      .where(
        or(
          and(
            eq(this.schema.friendRequest.senderId, senderId),
            eq(this.schema.friendRequest.recipientId, recipientId),
          ),
          and(
            eq(this.schema.friendRequest.senderId, recipientId),
            eq(this.schema.friendRequest.recipientId, senderId),
          ),
        ),
      );

    // Update profileStats for both users
    const updateProfileStats = async (userId: string) => {
      const userProfile = await db.query.profile.findFirst({
        where: eq(this.schema.profile.userId, userId),
      });

      if (!userProfile) {
        return err(new ProfileNotFoundError(userId));
      }

      await db
        .update(this.schema.profileStats)
        .set({ friends: sql`${this.schema.profileStats.friends} + 1` })
        .where(eq(this.schema.profileStats.profileId, userProfile.id));

      return ok(undefined);
    };

    const senderResult = await updateProfileStats(senderId);
    if (senderResult.isErr()) {
      return senderResult;
    }

    const recipientResult = await updateProfileStats(recipientId);
    if (recipientResult.isErr()) {
      return recipientResult;
    }

    return ok(undefined);
  }

  async removeFriend(
    params: RemoveFriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, FriendshipNotFoundError | ProfileNotFoundError>> {
    const { userIdA, userIdB } = params;

    // Ensure userIdA < userIdB for the query
    const [sortedUserIdA, sortedUserIdB] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    const result = await db
      .delete(this.schema.friend)
      .where(
        and(
          eq(this.schema.friend.userIdA, sortedUserIdA),
          eq(this.schema.friend.userIdB, sortedUserIdB),
        ),
      )
      .returning({ id: this.schema.friend.id });

    if (result.length === 0) {
      return err(new FriendshipNotFoundError());
    }

    // Update profileStats for both users
    const updateProfileStats = async (userId: string) => {
      const userProfile = await db.query.profile.findFirst({
        where: eq(this.schema.profile.userId, userId),
      });

      if (!userProfile) {
        return err(new ProfileNotFoundError(userId));
      }

      await db
        .update(this.schema.profileStats)
        .set({ friends: sql`${this.schema.profileStats.friends} - 1` })
        .where(eq(this.schema.profileStats.profileId, userProfile.id));

      return ok(undefined);
    };

    const userAResult = await updateProfileStats(userIdA);
    if (userAResult.isErr()) {
      return userAResult;
    }

    const userBResult = await updateProfileStats(userIdB);
    if (userBResult.isErr()) {
      return userBResult;
    }

    return ok(undefined);
  }

  async getFriendship(
    params: GetFriendshipParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<{ id: string } | undefined, never>> {
    const { userIdA, userIdB } = params;

    // Ensure userIdA < userIdB for the query
    const [sortedUserIdA, sortedUserIdB] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    const result = await db
      .select({ id: this.schema.friend.id })
      .from(this.schema.friend)
      .where(
        and(
          eq(this.schema.friend.userIdA, sortedUserIdA),
          eq(this.schema.friend.userIdB, sortedUserIdB),
        ),
      )
      .limit(1);

    return ok(result[0]);
  }

  async countFriends(
    params: CountFriendsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<number | undefined, never>> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.friend)
      .where(
        or(
          eq(this.schema.friend.userIdA, userId),
          eq(this.schema.friend.userIdB, userId),
        ),
      );

    return ok(result[0]?.count);
  }

  async countFriendRequests(
    params: CountFriendRequestsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<number | undefined, never>> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.friendRequest)
      .where(eq(this.schema.friendRequest.recipientId, userId));

    return ok(result[0]?.count);
  }

  async createFriendRequest(
    params: CreateFriendRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, never>> {
    const { senderId, recipientId } = params;

    await db
      .insert(this.schema.friendRequest)
      .values({ senderId, recipientId });

    return ok(undefined);
  }

  async deleteFriendRequest(
    params: DeleteFriendRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<void, FriendRequestNotFoundError>> {
    const { senderId, recipientId } = params;

    const result = await db
      .delete(this.schema.friendRequest)
      .where(
        and(
          eq(this.schema.friendRequest.senderId, senderId),
          eq(this.schema.friendRequest.recipientId, recipientId),
        ),
      )
      .returning({ id: this.schema.friendRequest.id });

    if (result.length === 0) {
      return err(new FriendRequestNotFoundError());
    }

    return ok(undefined);
  }

  async getFriendRequest(
    params: GetFriendRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<{ id: string } | undefined, never>> {
    const { senderId, recipientId } = params;

    const result = await db
      .select({ id: this.schema.friendRequest.id })
      .from(this.schema.friendRequest)
      .where(
        and(
          eq(this.schema.friendRequest.senderId, senderId),
          eq(this.schema.friendRequest.recipientId, recipientId),
        ),
      )
      .limit(1);

    return ok(result[0]);
  }

  async paginateFriendsSelf(
    params: PaginateFriendsSelfParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FriendResult[], never>> {
    const { forUserId, cursor = null, pageSize = 10 } = params;

    // Get all friends of the user
    const friends = await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.friend.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.friend,
        or(
          eq(this.schema.user.id, this.schema.friend.userIdA),
          eq(this.schema.user.id, this.schema.friend.userIdB),
        ),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          or(
            and(
              eq(this.schema.friend.userIdA, forUserId),
              not(eq(this.schema.user.id, forUserId)),
            ),
            and(
              eq(this.schema.friend.userIdB, forUserId),
              not(eq(this.schema.user.id, forUserId)),
            ),
          ),
          cursor
            ? or(
                gt(this.schema.friend.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.friend.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.friend.createdAt), asc(this.schema.profile.id))
      .limit(pageSize + 1);

    return ok(friends);
  }

  async paginateFriendsOther(
    params: PaginateFriendsOtherParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FriendResult[], never>> {
    const { forUserId, currentUserId, cursor = null, pageSize = 10 } = params;

    // Get all friends of the user
    const friends = await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.friend.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.friend,
        or(
          eq(this.schema.user.id, this.schema.friend.userIdA),
          eq(this.schema.user.id, this.schema.friend.userIdB),
        ),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          or(
            and(
              eq(this.schema.friend.userIdA, forUserId),
              not(eq(this.schema.user.id, forUserId)),
            ),
            and(
              eq(this.schema.friend.userIdB, forUserId),
              not(eq(this.schema.user.id, forUserId)),
            ),
          ),
          cursor
            ? or(
                gt(this.schema.friend.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.friend.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.friend.createdAt), asc(this.schema.profile.id))
      .limit(pageSize + 1);

    if (friends.length === 0) return ok([]);

    const userIds = friends.map((friend) => friend.userId);

    // Check if the current user is friends with any of the users
    const friendStatus = await db
      .select({ friendId: this.schema.user.id })
      .from(this.schema.user)
      .innerJoin(
        this.schema.friend,
        or(
          eq(this.schema.user.id, this.schema.friend.userIdA),
          eq(this.schema.user.id, this.schema.friend.userIdB),
        ),
      )
      .where(
        and(
          or(
            and(
              eq(this.schema.friend.userIdA, currentUserId),
              not(eq(this.schema.user.id, currentUserId)),
            ),
            and(
              eq(this.schema.friend.userIdB, currentUserId),
              not(eq(this.schema.user.id, currentUserId)),
            ),
          ),
        ),
      );

    // Check if the current user has sent friend requests to any of the users
    const friendRequestStatus = await db
      .select({ requestedId: this.schema.friendRequest.recipientId })
      .from(this.schema.friendRequest)
      .where(
        and(
          eq(this.schema.friendRequest.senderId, currentUserId),
          isNotNull(this.schema.friendRequest.recipientId),
        ),
      );

    const friendIds = new Set(friendStatus.map((status) => status.friendId));
    const requestedIds = new Set(
      friendRequestStatus.map((status) => status.requestedId),
    );

    const result = friends.map((friend) => ({
      ...friend,
      isFriend: friendIds.has(friend.userId),
      isFriendRequested: requestedIds.has(friend.userId),
    }));

    return ok(result);
  }

  async paginateFriendRequests(
    params: PaginateFriendRequestsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<FriendRequestResult[], never>> {
    const { forUserId, cursor = null, pageSize = 10 } = params;

    const results = await db
      .select({
        userId: this.schema.user.id,
        username: this.schema.profile.username,
        name: this.schema.profile.name,
        profilePictureUrl: this.schema.profile.profilePictureKey,
        createdAt: this.schema.friendRequest.createdAt,
        profileId: this.schema.profile.id,
      })
      .from(this.schema.user)
      .innerJoin(
        this.schema.friendRequest,
        eq(this.schema.user.id, this.schema.friendRequest.senderId),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.friendRequest.recipientId, forUserId),
          cursor
            ? or(
                gt(this.schema.friendRequest.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.friendRequest.createdAt, cursor.createdAt),
                  gt(this.schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(this.schema.friendRequest.createdAt),
        asc(this.schema.profile.id),
      )
      .limit(pageSize + 1);

    return ok(results);
  }

  async friendshipExists(
    params: FriendshipExistsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Result<boolean, never>> {
    const { userIdA, userIdB } = params;

    // Ensure userIdA < userIdB for the query
    const [sortedUserIdA, sortedUserIdB] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    const result = await db
      .select({ id: this.schema.friend.id })
      .from(this.schema.friend)
      .where(
        and(
          eq(this.schema.friend.userIdA, sortedUserIdA),
          eq(this.schema.friend.userIdB, sortedUserIdB),
        ),
      )
      .limit(1);

    return ok(result.length > 0);
  }
}
