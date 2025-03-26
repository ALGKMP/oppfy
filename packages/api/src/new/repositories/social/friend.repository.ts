import { and, asc, count, eq, gt, not, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";

import { TYPES } from "../../container";
import {
  FriendParams,
  FriendRequestParams,
  IFriendRepository,
  PaginateFriendParams,
  UserIdParams,
} from "../../interfaces/repositories/social/friend.repository.interface";
import { Profile } from "../../models";

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

  /**
   * Creates a new friendship between two users.
   * Ensures userIdA < userIdB for consistency in the database.
   * Updates the friends count for both users in userStats.
   */
  async createFriend(params: FriendParams, tx: Transaction): Promise<void> {
    const { userIdA, userIdB } = params;

    // Sort user IDs to ensure userIdA < userIdB
    const [sortedUserIdA, sortedUserIdB] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    // Insert the friendship record
    await tx.insert(this.schema.friend).values({
      userIdA: sortedUserIdA,
      userIdB: sortedUserIdB,
    });

    // Increment friends count for both users
    await tx
      .update(this.schema.userStats)
      .set({ friends: sql`${this.schema.userStats.friends} + 1` })
      .where(eq(this.schema.userStats.userId, userIdA));

    await tx
      .update(this.schema.userStats)
      .set({ friends: sql`${this.schema.userStats.friends} + 1` })
      .where(eq(this.schema.userStats.userId, userIdB));
  }

  /**
   * Removes an existing friendship between two users.
   * Uses sorted user IDs for consistency.
   * Decrements the friends count for both users in userStats.
   */
  async removeFriend(params: FriendParams, tx: Transaction): Promise<void> {
    const { userIdA, userIdB } = params;

    // Sort user IDs to ensure userIdA < userIdB
    const [sortedUserIdA, sortedUserIdB] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    // Delete the friendship record
    await tx
      .delete(this.schema.friend)
      .where(
        and(
          eq(this.schema.friend.userIdA, sortedUserIdA),
          eq(this.schema.friend.userIdB, sortedUserIdB),
        ),
      );

    // Decrement friends count for both users
    await tx
      .update(this.schema.userStats)
      .set({ friends: sql`${this.schema.userStats.friends} - 1` })
      .where(eq(this.schema.userStats.userId, userIdA));

    await tx
      .update(this.schema.userStats)
      .set({ friends: sql`${this.schema.userStats.friends} - 1` })
      .where(eq(this.schema.userStats.userId, userIdB));
  }

  /**
   * Creates a new friend request from sender to recipient.
   */
  async createFriendRequest(
    params: FriendRequestParams,
    tx: Transaction,
  ): Promise<void> {
    const { senderId, recipientId } = params;

    // Insert the friend request record
    await tx.insert(this.schema.friendRequest).values({
      senderId,
      recipientId,
    });
  }

  /**
   * Deletes an existing friend request.
   */
  async deleteFriendRequest(
    params: FriendRequestParams,
    tx: Transaction,
  ): Promise<void> {
    const { senderId, recipientId } = params;

    // Delete the friend request record
    await tx
      .delete(this.schema.friendRequest)
      .where(
        and(
          eq(this.schema.friendRequest.senderId, senderId),
          eq(this.schema.friendRequest.recipientId, recipientId),
        ),
      );
  }

  /**
   * Checks if two users are friends.
   * Uses sorted user IDs for consistency.
   */
  async isFriends(
    params: FriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<boolean> {
    const { userIdA, userIdB } = params;

    // Sort user IDs to ensure userIdA < userIdB
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

    return result.length > 0;
  }

  /**
   * Checks if a friend request exists from sender to recipient.
   */
  async isFriendRequested(
    params: FriendRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<boolean> {
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

    return result.length > 0;
  }

  /**
   * Counts the number of friends for a given user.
   */
  async countFriends(
    params: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
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

    return result[0]?.count ?? 0;
  }

  /**
   * Counts the number of incoming friend requests for a given user.
   */
  async countFriendRequests(
    params: UserIdParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.friendRequest)
      .where(eq(this.schema.friendRequest.recipientId, userId));

    return result[0]?.count ?? 0;
  }

  /**
   * Retrieves a paginated list of friends with their profile details.
   * Uses cursor-based pagination with createdAt and userId.
   */
  async paginateFriends(
    params: PaginateFriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile[]> {
    const { userId, cursor, limit = 10 } = params;

    const friends = await db
      .select()
      .from(this.schema.friend)
      .innerJoin(
        this.schema.user,
        or(
          eq(this.schema.friend.userIdA, userId),
          eq(this.schema.friend.userIdB, userId),
        ),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          not(eq(this.schema.user.id, userId)), // Exclude the user itself
          cursor
            ? or(
                gt(this.schema.friend.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.friend.createdAt, cursor.createdAt),
                  gt(this.schema.user.id, cursor.userId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(this.schema.friend.createdAt), asc(this.schema.user.id))
      .limit(limit);

    return friends.map((result) => result.profile);
  }

  /**
   * Retrieves a paginated list of incoming friend requests with sender profile details.
   * Uses cursor-based pagination with createdAt and userId.
   */
  async paginateFriendRequests(
    params: PaginateFriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Profile[]> {
    const { userId, cursor, limit = 10 } = params;

    const requests = await db
      .select()
      .from(this.schema.friendRequest)
      .innerJoin(
        this.schema.user,
        eq(this.schema.friendRequest.senderId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.friendRequest.recipientId, userId),
          cursor
            ? or(
                gt(this.schema.friendRequest.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.friendRequest.createdAt, cursor.createdAt),
                  gt(this.schema.user.id, cursor.userId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(this.schema.friendRequest.createdAt),
        asc(this.schema.user.id),
      )
      .limit(limit);

    return requests.map((result) => result.profile);
  }
}
