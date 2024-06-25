import { and, asc, count, eq, gt, not, or, sql } from "drizzle-orm";

import { db, isNotNull, schema } from "@oppfy/db";

import { friendRequest } from "../../../../db/src/schema/schema";
import { handleDatabaseErrors } from "../../errors";

export class FriendRepository {
  private db = db;

  @handleDatabaseErrors
  async addFriend(userId1: string, userId2: string) {
    return await this.db.transaction(async (tx) => {
      // Make userId1 follow userId2
      await tx
        .insert(schema.follower)
        .values({ senderId: userId1, recipientId: userId2 });

      // Make userId2 follow userId1
      await tx
        .insert(schema.follower)
        .values({ senderId: userId2, recipientId: userId1 });

      // Add the two users as friends
      await tx.insert(schema.friend).values({ userId1, userId2 });
      await tx.insert(schema.friend).values({ userId2, userId1 });

      // Delete the friend request from userId1 to userId2
      await tx
        .delete(schema.friendRequest)
        .where(
          and(
            eq(schema.friendRequest.senderId, userId1),
            eq(schema.friendRequest.recipientId, userId2),
          ),
        );

      return true;
    });
  }

  @handleDatabaseErrors
  async removeFriend(userId1: string, userId2: string) {
    const result = await this.db
      .delete(schema.friend)
      .where(
        and(
          and(
            eq(schema.friend.userId1, userId1),
            eq(schema.friend.userId2, userId2),
          ),
          and(
            eq(schema.friend.userId1, userId2),
            eq(schema.friend.userId2, userId1),
          ),
        ),
      );
    return result[0];
  }

  @handleDatabaseErrors
  async getFriend(userId1: string, userId2: string) {
    return await this.db.query.friend.findFirst({
      where: or(
        and(
          eq(schema.friend.userId1, userId1),
          eq(schema.friend.userId2, userId2),
        ),
        and(
          eq(schema.friend.userId1, userId2),
          eq(schema.friend.userId2, userId1),
        ),
      ),
    });
  }

  @handleDatabaseErrors
  async countFriends(userId: string): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.friend)
      .where(
        or(
          eq(schema.friend.userId1, userId),
          eq(schema.friend.userId2, userId),
        ),
      );
    return result[0]?.count;
  }

  async countFriendRequests(userId: string) {
    const result = await this.db
      .select({ count: count() })
      .from(schema.friendRequest)
      .where(eq(schema.friendRequest.recipientId, userId));

    return result[0]?.count ?? 0;
  }

  @handleDatabaseErrors
  async createFriendRequest(senderId: string, recipientId: string) {
    const result = await this.db
      .insert(schema.friendRequest)
      .values({ senderId, recipientId });
    return result[0];
  }

  @handleDatabaseErrors
  async cancelFriendRequest(senderId: string, recipientId: string) {
    const result = await this.db
      .delete(schema.friendRequest)
      .where(
        and(
          eq(schema.friendRequest.senderId, senderId),
          eq(schema.friendRequest.recipientId, recipientId),
        ),
      );
    return result[0];
  }

  @handleDatabaseErrors
  async getFriendRequest(senderId: string, targetUserId: string) {
    return await this.db.query.friendRequest.findFirst({
      where: and(
        eq(schema.friendRequest.senderId, senderId),
        eq(schema.friendRequest.recipientId, targetUserId),
      ),
    });
  }

  @handleDatabaseErrors
  async paginateFriendsSelf(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    const friends = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.friend.createdAt,
        profileId: schema.profile.id,
      })
      .from(schema.friend)
      .innerJoin(
        schema.user,
        or(
          eq(schema.friend.userId1, schema.user.id),
          eq(schema.friend.userId2, schema.user.id),
        ),
      )
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          or(
            eq(schema.friend.userId1, forUserId),
            eq(schema.friend.userId2, forUserId),
          ),
          not(eq(schema.user.id, forUserId)), // Exclude the current user
          cursor
            ? or(
                gt(schema.friend.createdAt, cursor.createdAt),
                and(
                  eq(schema.friend.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          // ! as of now drizzle does not update the return type
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.fullName),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.friend.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    // todo: remove when drizzle fixes the return type for isNotNull
    return friends as {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string;
      profileId: number;
      privacy: "public" | "private";
      createdAt: Date;
    }[];
  }

  @handleDatabaseErrors
  async paginateFriendsOther(
    forUserId: string,
    currentUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    const friends = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        profileId: schema.profile.id,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN EXISTS (
            SELECT 1 FROM ${schema.follower} f
            WHERE f.senderId = ${currentUserId} AND f.recipientId = ${schema.user.id}
          ) THEN 'following'
          WHEN EXISTS (
            SELECT 1 FROM ${schema.followRequest} fr
            WHERE fr.senderId = ${currentUserId} AND fr.recipientId = ${schema.user.id}
          ) THEN 'followRequestSent'
          ELSE 'notFollowing'
        END
        `,
        createdAt: schema.follower.createdAt,
      })
      .from(schema.friend)
      .innerJoin(
        schema.user,
        or(
          eq(schema.friend.userId1, schema.user.id),
          eq(schema.friend.userId2, schema.user.id),
        ),
      )
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          or(
            eq(schema.friend.userId1, forUserId),
            eq(schema.friend.userId2, forUserId),
          ),
          not(eq(schema.user.id, forUserId)), // Exclude the current user
          cursor
            ? or(
                gt(schema.friend.createdAt, cursor.createdAt),
                and(
                  eq(schema.friend.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          // ! as of now drizzle does not update the return type
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.fullName),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.friend.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    return friends as {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string;
      profileId: number;
      privacy: "public" | "private";
      relationshipState: "following" | "followRequestSent" | "notFollowing";
      createdAt: Date;
    }[];
  }

  @handleDatabaseErrors
  async paginateFriendRequests(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profileId: schema.profile.id,
        profilePictureUrl: schema.profile.profilePictureKey,
        friendRequestId: schema.friendRequest.id,
        createdAt: schema.friendRequest.createdAt,
      })
      .from(schema.friendRequest)
      .innerJoin(
        schema.user,
        eq(schema.friendRequest.senderId, schema.user.id), // Changed to senderId
      )
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.friendRequest.recipientId, forUserId),
          cursor
            ? or(
                gt(schema.friendRequest.createdAt, cursor.createdAt),
                and(
                  eq(schema.friendRequest.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(schema.friendRequest.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }
}
