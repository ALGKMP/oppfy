import { and, asc, count, eq, gt, or, sql } from "drizzle-orm";

import { db, isNotNull, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class FollowRepository {
  private db = db;

  @handleDatabaseErrors
  async createFollower({
    senderUserId,
    recipientUserId,
  }: {
    senderUserId: string;
    recipientUserId: string;
  }) {
    return await this.db.transaction(async (tx) => {
      await tx
        .insert(schema.follow)
        .values({ recipientId: recipientUserId, senderId: senderUserId });

      const senderProfile = await tx.query.profile.findFirst({
        where: eq(schema.profile.userId, senderUserId),
      });

      if (!senderProfile) throw new Error("Sender profile not found");

      await tx
        .update(schema.profileStats)
        .set({ following: sql`${schema.profileStats.following} + 1` })
        .where(eq(schema.profileStats.profileId, senderProfile.id));

      const recipientProfile = await tx.query.profile.findFirst({
        where: eq(schema.profile.userId, recipientUserId),
      });

      if (!recipientProfile) throw new Error("Recipient profile not found");

      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} + 1` })
        .where(eq(schema.profileStats.profileId, recipientProfile.id));
    });
  }

  @handleDatabaseErrors
  async removeFollower({
    followerId,
    followeeId,
  }: {
    followerId: string;
    followeeId: string;
  }) {
    return await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.follow)
        .where(
          and(
            eq(schema.follow.senderId, followerId),
            eq(schema.follow.recipientId, followeeId),
          ),
        );

      const senderProfile = await tx.query.profile.findFirst({
        where: eq(schema.profile.userId, followerId),
      });

      if (!senderProfile) throw new Error("Sender profile not found");

      await tx
        .update(schema.profileStats)
        .set({ following: sql`${schema.profileStats.following} - 1` })
        .where(eq(schema.profileStats.profileId, senderProfile.id));

      const recipientProfile = await tx.query.profile.findFirst({
        where: eq(schema.profile.userId, followeeId),
      });

      if (!recipientProfile) throw new Error("Recipient profile not found");

      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} - 1` })
        .where(eq(schema.profileStats.profileId, recipientProfile.id));
    });
  }

  @handleDatabaseErrors
  async removeFollowRequest(senderId: string, recipientId: string) {
    const result = await this.db
      .delete(schema.followRequest)
      .where(
        and(
          eq(schema.followRequest.senderId, senderId),
          eq(schema.followRequest.recipientId, recipientId),
        ),
      );
    return result[0];
  }

  @handleDatabaseErrors
  async getFollower({
    followerId,
    followeeId,
  }: {
    followerId: string;
    followeeId: string;
  }) {
    return await this.db.query.follow.findFirst({
      where: and(
        eq(schema.follow.senderId, followerId),
        eq(schema.follow.recipientId, followeeId),
      ),
    });
  }

  @handleDatabaseErrors
  async countFollowers({
    userId,
  }: {
    userId: string;
  }): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.follow)
      .where(eq(schema.follow.recipientId, userId));

    return result[0]?.count;
  }

  @handleDatabaseErrors
  async countFollowing({
    userId,
  }: {
    userId: string;
  }): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.follow)
      .where(eq(schema.follow.senderId, userId));

    return result[0]?.count;
  }

  @handleDatabaseErrors
  async countFollowRequests({
    userId,
  }: {
    userId: string;
  }): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.followRequest)
      .where(eq(schema.followRequest.recipientId, userId));

    return result[0]?.count;
  }

  @handleDatabaseErrors
  async deleteFollowRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    await this.db
      .delete(schema.followRequest)
      .where(
        and(
          eq(schema.followRequest.senderId, senderId),
          eq(schema.followRequest.recipientId, recipientId),
        ),
      );
  }

  @handleDatabaseErrors
  async createFollowRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    await this.db
      .insert(schema.followRequest)
      .values({ senderId, recipientId });
  }

  @handleDatabaseErrors
  async getFollowRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    return await this.db.query.followRequest.findFirst({
      where: and(
        eq(schema.followRequest.senderId, senderId),
        eq(schema.followRequest.recipientId, recipientId),
      ),
    });
  }

  @handleDatabaseErrors
  async acceptFollowRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    return await this.db.transaction(async (tx) => {
      // Delete the follow request
      await tx
        .delete(schema.followRequest)
        .where(
          and(
            eq(schema.followRequest.senderId, senderId),
            eq(schema.followRequest.recipientId, recipientId),
          ),
        );

      // Create the follow relationship
      await tx.insert(schema.follow).values({ senderId, recipientId });

      // Update the sender's following count
      const senderProfile = await tx.query.profile.findFirst({
        where: eq(schema.profile.userId, senderId),
      });

      if (!senderProfile) throw new Error("Sender profile not found");

      await tx
        .update(schema.profileStats)
        .set({ following: sql`${schema.profileStats.following} + 1` })
        .where(eq(schema.profileStats.profileId, senderProfile.id));

      // Update the recipient's followers count
      const recipientProfile = await tx.query.profile.findFirst({
        where: eq(schema.profile.userId, recipientId),
      });

      if (!recipientProfile) throw new Error("Recipient profile not found");

      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} + 1` })
        .where(eq(schema.profileStats.profileId, recipientProfile.id));
    });
  }

  @handleDatabaseErrors
  async paginateFollowersSelf({
    forUserId,
    cursor = null,
    pageSize = 10,
  }: {
    forUserId: string;
    cursor?: { createdAt: Date; profileId: string } | null;
    pageSize?: number;
  }) {
    const data = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        name: schema.profile.name,
        username: schema.profile.username,
        profilePictureUrl: schema.profile.profilePictureKey,
        privacy: schema.user.privacySetting,
        createdAt: schema.follow.createdAt,
      })
      .from(schema.follow)
      .innerJoin(schema.user, eq(schema.follow.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .where(
        and(
          eq(schema.follow.recipientId, forUserId),
          cursor
            ? or(
                gt(schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(schema.follow.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follow.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    return data as {
      userId: string;
      profileId: string;
      name: string;
      username: string;
      profilePictureUrl: string | null;
      privacy: "public" | "private";
      createdAt: Date;
    }[];
  }

  @handleDatabaseErrors
  async paginateFollowersOthers({
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
    const followers = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        profilePictureUrl: schema.profile.profilePictureKey,
        profileId: schema.profile.id,
        privacy: schema.user.privacySetting,
        createdAt: schema.follow.createdAt,
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
      .from(schema.follow)
      .innerJoin(schema.user, eq(schema.follow.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .where(
        and(
          eq(schema.follow.recipientId, forUserId),
          cursor
            ? or(
                gt(schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(schema.follow.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follow.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    return followers as {
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
  async getAllFollowingIds({ forUserId }: { forUserId: string }) {
    const followingUsers = await this.db
      .select({ followingId: schema.follow.recipientId })
      .from(schema.follow)
      .where(eq(schema.follow.senderId, forUserId));

    return followingUsers.map((user) => user.followingId);
  }

  @handleDatabaseErrors
  async paginateFollowingSelf({
    userId,
    cursor = null,
    pageSize = 10,
  }: {
    userId: string;
    cursor?: { createdAt: Date; profileId: string } | null;
    pageSize?: number;
  }) {
    const following = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        name: schema.profile.name,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follow.createdAt,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN EXISTS (
            SELECT 1 FROM ${schema.follow} f
            WHERE f.sender_id = ${userId} AND f.recipient_id = ${schema.user.id}
          ) THEN 'following'
          WHEN EXISTS (
            SELECT 1 FROM ${schema.followRequest} fr
            WHERE fr.sender_id = ${userId} AND fr.recipient_id = ${schema.user.id}
          ) THEN 'followRequestSent'
          ELSE 'notFollowing'
        END
        `,
      })
      .from(schema.follow)
      .innerJoin(schema.user, eq(schema.follow.recipientId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .where(
        and(
          eq(schema.follow.senderId, userId),
          cursor
            ? or(
                gt(schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(schema.follow.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follow.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    return following as {
      userId: string;
      profileId: string;
      username: string;
      name: string;
      privacy: "public" | "private";
      profilePictureUrl: string | null;
      relationshipState: "following" | "followRequestSent" | "notFollowing";
      createdAt: Date;
    }[];
  }

  @handleDatabaseErrors
  async paginateFollowingOthers({
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
    const followers = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        name: schema.profile.name,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follow.createdAt,
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
      .from(schema.follow)
      .innerJoin(schema.user, eq(schema.follow.recipientId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .where(
        and(
          eq(schema.follow.senderId, forUserId),
          cursor
            ? or(
                gt(schema.follow.createdAt, cursor.createdAt),
                and(
                  eq(schema.follow.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follow.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    return followers as {
      userId: string;
      profileId: string;
      username: string;
      name: string;
      privacy: "public" | "private";
      profilePictureUrl: string | null;
      relationshipState: "following" | "followRequestSent" | "notFollowing";
      createdAt: Date;
    }[];
  }

  @handleDatabaseErrors
  async paginateFollowRequests({
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
        followRequestId: schema.followRequest.id,
        createdAt: schema.followRequest.createdAt,
      })
      .from(schema.followRequest)
      .innerJoin(schema.user, eq(schema.followRequest.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .where(
        and(
          eq(schema.followRequest.recipientId, forUserId),
          cursor
            ? or(
                gt(schema.followRequest.createdAt, cursor.createdAt),
                and(
                  eq(schema.followRequest.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(schema.followRequest.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }
}
