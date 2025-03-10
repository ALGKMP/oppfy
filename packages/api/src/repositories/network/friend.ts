import { and, asc, count, eq, gt, not, or, sql } from "drizzle-orm";

import { db, isNotNull, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class FriendRepository {
  private db = db;

  @handleDatabaseErrors
  async createFriend({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    return await this.db.transaction(async (tx) => {
      // Create friend relationship, ensuring userIdA < userIdB
      const [userIdA, userIdB] =
        senderId < recipientId
          ? [senderId, recipientId]
          : [recipientId, senderId];

      await tx.insert(schema.friend).values([{ userIdA, userIdB }]);

      // Delete the friend request
      await tx
        .delete(schema.friendRequest)
        .where(
          or(
            and(
              eq(schema.friendRequest.senderId, senderId),
              eq(schema.friendRequest.recipientId, recipientId),
            ),
            and(
              eq(schema.friendRequest.senderId, recipientId),
              eq(schema.friendRequest.recipientId, senderId),
            ),
          ),
        );

      // Update profileStats for both users
      const updateProfileStats = async (userId: string) => {
        const userProfile = await tx.query.profile.findFirst({
          where: eq(schema.profile.userId, userId),
        });

        if (!userProfile)
          throw new Error(`Profile not found for user ${userId}`);

        await tx
          .update(schema.profileStats)
          .set({ friends: sql`${schema.profileStats.friends} + 1` })
          .where(eq(schema.profileStats.profileId, userProfile.id));
      };

      await updateProfileStats(senderId);
      await updateProfileStats(recipientId);
    });
  }

  @handleDatabaseErrors
  async removeFriend({
    userIdA,
    userIdB,
  }: {
    userIdA: string;
    userIdB: string;
  }) {
    return await this.db.transaction(async (tx) => {
      // Ensure userIdA < userIdB for the query
      const [userId1, userId2] =
        userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

      // Delete the friendship
      await tx
        .delete(schema.friend)
        .where(
          and(
            eq(schema.friend.userIdA, userId1),
            eq(schema.friend.userIdB, userId2),
          ),
        );

      // Update profileStats for both users
      const updateProfileStats = async (userId: string) => {
        const userProfile = await tx.query.profile.findFirst({
          where: eq(schema.profile.userId, userId),
        });

        if (!userProfile)
          throw new Error(`Profile not found for user ${userId}`);

        await tx
          .update(schema.profileStats)
          .set({ friends: sql`${schema.profileStats.friends} - 1` })
          .where(eq(schema.profileStats.profileId, userProfile.id));
      };

      await updateProfileStats(userIdA);
      await updateProfileStats(userIdB);
    });
  }

  @handleDatabaseErrors
  async getFriendship({
    userIdA,
    userIdB,
  }: {
    userIdA: string;
    userIdB: string;
  }) {
    // Ensure userIdA < userIdB for the query
    const [userId1, userId2] =
      userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];

    return await this.db.query.friend.findFirst({
      where: and(
        eq(schema.friend.userIdA, userId1),
        eq(schema.friend.userIdB, userId2),
      ),
    });
  }

  @handleDatabaseErrors
  async countFriends({
    userId,
  }: {
    userId: string;
  }): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.friend)
      .where(
        or(
          eq(schema.friend.userIdA, userId),
          eq(schema.friend.userIdB, userId),
        ),
      );

    return result[0]?.count;
  }

  @handleDatabaseErrors
  async countFriendRequests({ userId }: { userId: string }) {
    const result = await this.db
      .select({ count: count() })
      .from(schema.friendRequest)
      .where(eq(schema.friendRequest.recipientId, userId));

    return result[0]?.count;
  }

  @handleDatabaseErrors
  async createFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    await this.db
      .insert(schema.friendRequest)
      .values({ senderId, recipientId });
  }

  @handleDatabaseErrors
  async deleteFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    await this.db
      .delete(schema.friendRequest)
      .where(
        and(
          eq(schema.friendRequest.senderId, senderId),
          eq(schema.friendRequest.recipientId, recipientId),
        ),
      );
  }

  @handleDatabaseErrors
  async getFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    return await this.db.query.friendRequest.findFirst({
      where: and(
        eq(schema.friendRequest.senderId, senderId),
        eq(schema.friendRequest.recipientId, recipientId),
      ),
    });
  }

  @handleDatabaseErrors
  async paginateFriendsSelf({
    forUserId,
    cursor = null,
    pageSize = 10,
  }: {
    forUserId: string;
    cursor?: { createdAt: Date; profileId: string } | null;
    pageSize?: number;
  }) {
    const friends = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        profileId: schema.profile.id,
        createdAt: schema.friend.createdAt,
      })
      .from(schema.friend)
      .innerJoin(
        schema.user,
        or(
          eq(schema.friend.userIdA, schema.user.id),
          eq(schema.friend.userIdB, schema.user.id),
        ),
      )
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .where(
        and(
          or(
            eq(schema.friend.userIdA, forUserId),
            eq(schema.friend.userIdB, forUserId),
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
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.friend.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    return friends as {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      profileId: string;
      privacy: "public" | "private";
      createdAt: Date;
    }[];
  }

  @handleDatabaseErrors
  async paginateFriendsOther({
    forUserId,
    currentUserId,
    cursor = null,
    pageSize = 10,
  }: {
    forUserId: string;
    currentUserId: string;
    cursor?: { createdAt: Date; profileId: string } | null;
    pageSize?: number;
  }) {
    const friends = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        profileId: schema.profile.id,
        createdAt: schema.friend.createdAt,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN EXISTS (
            SELECT 1 FROM ${schema.follow} f
            WHERE f.sender_id = ${currentUserId} AND f.recipient_id = ${schema.user.id}
          ) THEN 'following'
          WHEN EXISTS (
            SELECT 1 FROM ${schema.followRequest} fr
            WHERE fr.sender_id = ${currentUserId} AND fr.recipient_id = ${schema.user.id}
          ) THEN 'followRequestSent'
          ELSE 'notFollowing'
        END
        `,
      })
      .from(schema.friend)
      .innerJoin(
        schema.user,
        or(
          eq(schema.friend.userIdA, schema.user.id),
          eq(schema.friend.userIdB, schema.user.id),
        ),
      )
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .where(
        and(
          or(
            eq(schema.friend.userIdA, forUserId),
            eq(schema.friend.userIdB, forUserId),
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
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.friend.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    return friends as {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      profileId: string;
      privacy: "public" | "private";
      relationshipState: "following" | "followRequestSent" | "notFollowing";
      createdAt: Date;
    }[];
  }

  @handleDatabaseErrors
  async paginateFriendRequests({
    forUserId,
    cursor = null,
    pageSize = 10,
  }: {
    forUserId: string;
    cursor?: { createdAt: Date; profileId: string } | null;
    pageSize?: number;
  }) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        profileId: schema.profile.id,
        profilePictureUrl: schema.profile.profilePictureKey,
        friendRequestId: schema.friendRequest.id,
        createdAt: schema.friendRequest.createdAt,
      })
      .from(schema.friendRequest)
      .innerJoin(schema.user, eq(schema.friendRequest.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
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

  @handleDatabaseErrors
  async friendshipExists({
    userIdA,
    userIdB,
  }: {
    userIdA: string;
    userIdB: string;
  }) {
    return !!(await this.getFriendship({ userIdA, userIdB }));
  }
}
