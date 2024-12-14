import { and, asc, count, eq, gt, or, sql } from "drizzle-orm";

import { aliasedTable, db, isNotNull, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class FollowRepository {
  private db = db;

  @handleDatabaseErrors
  async createFollower(senderUserId: string, recipientUserId: string) {
    return await this.db.transaction(async (tx) => {
      await tx
        .insert(schema.follower)
        .values({ recipientId: recipientUserId, senderId: senderUserId });

      const [senderProfile] = await tx
        .select({ profileId: schema.user.profileId })
        .from(schema.user)
        .where(eq(schema.user.id, senderUserId));

      if (!senderProfile) throw new Error("Sender profile not found");

      await tx
        .update(schema.profileStats)
        .set({ following: sql`${schema.profileStats.following} + 1` })
        .where(eq(schema.profileStats.profileId, senderProfile.profileId));

      const [recipientProfile] = await tx
        .select({ profileId: schema.user.profileId })
        .from(schema.user)
        .where(eq(schema.user.id, recipientUserId));

      if (!recipientProfile) throw new Error("Recipient profile not found");

      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} + 1` })
        .where(eq(schema.profileStats.profileId, recipientProfile.profileId));
    });
  }

  @handleDatabaseErrors
  async removeFollower(senderId: string, recipientId: string) {
    return await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.follower)
        .where(
          and(
            eq(schema.follower.senderId, senderId),
            eq(schema.follower.recipientId, recipientId),
          ),
        );

      const [senderProfile] = await tx
        .select({ profileId: schema.user.profileId })
        .from(schema.user)
        .where(eq(schema.user.id, senderId));

      if (!senderProfile) throw new Error("Sender profile not found");

      // Update sender's following count
      await tx
        .update(schema.profileStats)
        .set({ following: sql`${schema.profileStats.following} - 1` })
        .where(eq(schema.profileStats.profileId, senderProfile.profileId));

      const [recipientProfile] = await tx
        .select({ profileId: schema.user.profileId })
        .from(schema.user)
        .where(eq(schema.user.id, recipientId));

      if (!recipientProfile) throw new Error("Recipient profile not found");

      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} - 1` })
        .where(eq(schema.profileStats.profileId, recipientProfile.profileId));
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
  async getFollower(senderId: string, recipientId: string) {
    return await this.db.query.follower.findFirst({
      where: and(
        eq(schema.follower.senderId, senderId),
        eq(schema.follower.recipientId, recipientId),
      ),
    });
  }

  @handleDatabaseErrors
  async countFollowers(userId: string): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.follower)
      .where(eq(schema.follower.recipientId, userId));

    return result[0]?.count;
  }

  @handleDatabaseErrors
  async countFollowing(userId: string): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.follower)
      .where(eq(schema.follower.senderId, userId));
    return result[0]?.count;
  }

  @handleDatabaseErrors
  async countFollowRequests(userId: string): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.followRequest)
      .where(eq(schema.followRequest.recipientId, userId));
    return result[0]?.count ?? 0;
  }

  @handleDatabaseErrors
  async createFollowRequest(senderId: string, recipientId: string) {
    const result = await this.db
      .insert(schema.followRequest)
      .values({ senderId, recipientId });
    return result[0];
  }

  @handleDatabaseErrors
  async getFollowRequest(senderId: string, recipientId: string) {
    return await this.db.query.followRequest.findFirst({
      where: and(
        eq(schema.followRequest.senderId, senderId),
        eq(schema.followRequest.recipientId, recipientId),
      ),
    });
  }

  @handleDatabaseErrors
  async acceptFollowRequest(senderId: string, recipientId: string) {
    return await this.db.transaction(async (tx) => {
      // Make sender follow recipient
      await tx.insert(schema.follower).values({ senderId, recipientId });

      // Delete the follow request from sender to recipient
      await tx
        .delete(schema.followRequest)
        .where(
          and(
            eq(schema.followRequest.senderId, senderId),
            eq(schema.followRequest.recipientId, recipientId),
          ),
        );

      // Update profileStats for both sender and recipient
      const [senderProfile] = await tx
        .select({ profileId: schema.user.profileId })
        .from(schema.user)
        .where(eq(schema.user.id, senderId));

      if (!senderProfile) throw new Error("Sender profile not found");

      await tx
        .update(schema.profileStats)
        .set({ following: sql`${schema.profileStats.following} + 1` })
        .where(eq(schema.profileStats.profileId, senderProfile.profileId));

      const [recipientProfile] = await tx
        .select({ profileId: schema.user.profileId })
        .from(schema.user)
        .where(eq(schema.user.id, recipientId));

      if (!recipientProfile) throw new Error("Recipient profile not found");

      await tx
        .update(schema.profileStats)
        .set({ followers: sql`${schema.profileStats.followers} + 1` })
        .where(eq(schema.profileStats.profileId, recipientProfile.profileId));

      return true;
    });
  }

  @handleDatabaseErrors
  async paginateFollowersSelf(
    forUserId: string,
    cursor: { createdAt: Date; profileId: string } | null = null,
    pageSize = 10,
  ) {
    const data = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        name: schema.profile.name,
        username: schema.profile.username,
        profilePictureUrl: schema.profile.profilePictureKey,
        privacy: schema.user.privacySetting,
        createdAt: schema.follower.createdAt,
      })
      .from(schema.follower)
      .innerJoin(schema.user, eq(schema.follower.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.follower.recipientId, forUserId),
          cursor
            ? or(
                gt(schema.follower.createdAt, cursor.createdAt),
                and(
                  eq(schema.follower.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          // ! as of now drizzle does not update the return type
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    // todo: remove when drizzle fixes the return type for isNotNull
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
  async paginateFollowersOthers(
    forUserId: string,
    currentUserId: string,
    cursor: { createdAt: Date; profileId: string } | null = null,
    pageSize = 10,
  ) {
    const followers = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        profilePictureUrl: schema.profile.profilePictureKey,
        profileId: schema.profile.id,
        privacy: schema.user.privacySetting,
        createdAt: schema.follower.createdAt,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN EXISTS (
            SELECT 1 FROM ${schema.follower} f
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
      .from(schema.follower)
      .innerJoin(schema.user, eq(schema.follower.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.follower.recipientId, forUserId),
          cursor
            ? or(
                gt(schema.follower.createdAt, cursor.createdAt),
                and(
                  eq(schema.follower.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          // ! as of now drizzle does not update the return type
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    // todo: remove when drizzle fixes the return type for isNotNull
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
  async getAllFollowingIds(forUserId: string) {
    const following = await this.db
      .select({ userId: schema.follower.recipientId })
      .from(schema.follower)
      .where(eq(schema.follower.senderId, forUserId));

    return following.map((f) => f.userId);
  }

  @handleDatabaseErrors
  async paginateFollowingSelf(
    userId: string,
    cursor: { createdAt: Date; profileId: string } | null = null,
    pageSize = 10,
  ) {
    const following = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        name: schema.profile.name,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follower.createdAt,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN EXISTS (
            SELECT 1 FROM ${schema.follower} f
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
      .from(schema.follower)
      .innerJoin(schema.user, eq(schema.follower.recipientId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.follower.senderId, userId),
          cursor
            ? or(
                gt(schema.follower.createdAt, cursor.createdAt),
                and(
                  eq(schema.follower.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          // ! as of now drizzle does not update the return type
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    // todo: remove when drizzle fixes the return type for isNotNull
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
  async paginateFollowingOthers(
    forUserId: string,
    currentUserId: string,
    cursor: { createdAt: Date; profileId: string } | null = null,
    pageSize = 10,
  ) {
    const followers = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        name: schema.profile.name,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follower.createdAt,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN EXISTS (
            SELECT 1 FROM ${schema.follower} f
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
      .from(schema.follower)
      .innerJoin(schema.user, eq(schema.follower.recipientId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.follower.senderId, forUserId),
          cursor
            ? or(
                gt(schema.follower.createdAt, cursor.createdAt),
                and(
                  eq(schema.follower.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
          // ! as of now drizzle does not update the return type
          isNotNull(schema.profile.username),
          isNotNull(schema.profile.name),
          isNotNull(schema.profile.dateOfBirth),
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    // todo: remove when drizzle fixes the return type for isNotNull
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
  async paginateFollowRequests(
    forUserId: string,
    cursor: { createdAt: Date; profileId: string } | null = null,
    pageSize = 10,
  ) {
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
      .innerJoin(schema.user, eq(schema.followRequest.senderId, schema.user.id)) // Changed to senderId
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
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
