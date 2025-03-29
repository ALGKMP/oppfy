import { and, asc, count, eq, exists, gt, not, or, sql } from "drizzle-orm";
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
  SocialProfile,
  UserIdParams,
} from "../../interfaces/repositories/social/friend.repository.interface";
import { Friend, FriendRequest, Profile } from "../../models";

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

  async getFriend(
    params: FriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Friend | undefined> {
    const { userIdA, userIdB } = params;
    const [sortedUserIdA, sortedUserIdB] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    const result = await db
      .select()
      .from(this.schema.friend)
      .where(
        and(
          eq(this.schema.friend.userIdA, sortedUserIdA),
          eq(this.schema.friend.userIdB, sortedUserIdB),
        ),
      );
    return result[0];
  }

  async getFriendRequest(
    params: FriendRequestParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<FriendRequest | undefined> {
    const { senderUserId, recipientUserId } = params;

    const result = await db
      .select()
      .from(this.schema.friendRequest)
      .where(
        and(
          eq(this.schema.friendRequest.senderUserId, senderUserId),
          eq(this.schema.friendRequest.recipientUserId, recipientUserId),
        ),
      );
    return result[0];
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
  async deleteFriend(params: FriendParams, tx: Transaction): Promise<void> {
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
    const { senderUserId, recipientUserId } = params;

    // Insert the friend request record
    await tx.insert(this.schema.friendRequest).values({
      senderUserId,
      recipientUserId,
    });

    await tx
      .update(this.schema.userStats)
      .set({ friendRequests: sql`${this.schema.userStats.friendRequests} + 1` })
      .where(eq(this.schema.userStats.userId, recipientUserId));
  }

  /**
   * Deletes an existing friend request.
   */
  async deleteFriendRequest(
    params: FriendRequestParams,
    tx: Transaction,
  ): Promise<void> {
    const { senderUserId, recipientUserId } = params;

    // Delete the friend request record
    await tx
      .delete(this.schema.friendRequest)
      .where(
        and(
          eq(this.schema.friendRequest.senderUserId, senderUserId),
          eq(this.schema.friendRequest.recipientUserId, recipientUserId),
        ),
      );

    await tx
      .update(this.schema.userStats)
      .set({ friendRequests: sql`${this.schema.userStats.friendRequests} - 1` })
      .where(eq(this.schema.userStats.userId, recipientUserId));
  }

  async cleanupFriendRelationships(
    params: FriendParams,
    tx: Transaction,
  ): Promise<void> {
    const { userIdA, userIdB } = params;

    await Promise.all([
      // Remove friendship (bidirectional)
      tx
        .delete(this.schema.friend)
        .where(
          or(
            and(
              eq(this.schema.friend.userIdA, userIdA),
              eq(this.schema.friend.userIdB, userIdB),
            ),
            and(
              eq(this.schema.friend.userIdA, userIdB),
              eq(this.schema.friend.userIdB, userIdA),
            ),
          ),
        ),

      // Delete friend requests: userIdA -> userIdB and userIdB -> userIdA
      tx
        .delete(this.schema.friendRequest)
        .where(
          or(
            and(
              eq(this.schema.friendRequest.senderUserId, userIdA),
              eq(this.schema.friendRequest.recipientUserId, userIdB),
            ),
            and(
              eq(this.schema.friendRequest.senderUserId, userIdB),
              eq(this.schema.friendRequest.recipientUserId, userIdA),
            ),
          ),
        ),

      // Update userStats for userIdA: decrement friends if a friendship existed
      tx
        .update(this.schema.userStats)
        .set({ friends: sql`${this.schema.userStats.friends} - 1` })
        .where(
          and(
            eq(this.schema.userStats.userId, userIdA),
            exists(
              tx
                .select()
                .from(this.schema.friend)
                .where(
                  or(
                    and(
                      eq(this.schema.friend.userIdA, userIdA),
                      eq(this.schema.friend.userIdB, userIdB),
                    ),
                    and(
                      eq(this.schema.friend.userIdA, userIdB),
                      eq(this.schema.friend.userIdB, userIdA),
                    ),
                  ),
                ),
            ),
          ),
        ),

      // Update userStats for userIdB: decrement friends if a friendship existed
      tx
        .update(this.schema.userStats)
        .set({ friends: sql`${this.schema.userStats.friends} - 1` })
        .where(
          and(
            eq(this.schema.userStats.userId, userIdB),
            exists(
              tx
                .select()
                .from(this.schema.friend)
                .where(
                  or(
                    and(
                      eq(this.schema.friend.userIdA, userIdA),
                      eq(this.schema.friend.userIdB, userIdB),
                    ),
                    and(
                      eq(this.schema.friend.userIdA, userIdB),
                      eq(this.schema.friend.userIdB, userIdA),
                    ),
                  ),
                ),
            ),
          ),
        ),
    ]);

    // Decrement friend requests: userIdA -> userIdB and userIdB -> userIdA
    await tx
      .update(this.schema.userStats)
      .set({ friendRequests: sql`${this.schema.userStats.friendRequests} - 1` })
      .where(
        and(
          eq(this.schema.userStats.userId, userIdA),
          eq(this.schema.userStats.userId, userIdB),
        ),
      );  
  }

  /**
   * Retrieves a paginated list of friends with their profile details.
   * Uses cursor-based pagination with createdAt and userId.
   */
  async paginateFriends(
    params: PaginateFriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { userId, cursor, limit = 10 } = params;

    const friends = await db
      .select({
        profile: this.schema.profile,
        friendedAt: this.schema.friend.createdAt,
      })
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

    return friends.map((friend) => ({
      ...friend.profile,
      friendedAt: friend.friendedAt,
    }));
  }

  /**
   * Retrieves a paginated list of incoming friend requests with sender profile details.
   * Uses cursor-based pagination with createdAt and userId.
   */
  async paginateFriendRequests(
    params: PaginateFriendParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<SocialProfile[]> {
    const { userId, cursor, limit = 10 } = params;

    const requests = await db
      .select({
        profile: this.schema.profile,
        friendedAt: this.schema.friendRequest.createdAt,
      })
      .from(this.schema.friendRequest)
      .innerJoin(
        this.schema.user,
        eq(this.schema.friendRequest.senderUserId, this.schema.user.id),
      )
      .innerJoin(
        this.schema.profile,
        eq(this.schema.user.id, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.friendRequest.recipientUserId, userId),
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

    return requests.map((request) => ({
      ...request.profile,
      friendedAt: request.friendedAt,
    }));
  }
}
