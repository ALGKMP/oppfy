import { and, asc, count, eq, gt, or, sql } from "drizzle-orm";

import { aliasedTable, db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class FollowRepository {
  private db = db;

  @handleDatabaseErrors
  async addFollower(senderId: string, recipientId: string) {
    const result = await this.db
      .insert(schema.follower)
      .values({ recipientId, senderId });
    return result[0];
  }

  @handleDatabaseErrors
  async removeFollower(senderId: string, recipientId: string) {
    const result = await this.db.delete(schema.follower).where(
      // Sender is removing the recipient from their followers
      and(
        eq(schema.follower.senderId, senderId),
        eq(schema.follower.recipientId, recipientId),
      ),
    );
    return result[0];
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

      return true;
    });
  }

  @handleDatabaseErrors
  async paginateFollowersSelf(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
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
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async paginateFollowersOthers(
    forUserId: string,
    currentUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    const followers = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follower.createdAt,
        profileId: schema.profile.id,
        isFollowing: sql<number>`EXISTS (
        SELECT 1 FROM ${schema.follower}
        WHERE ${schema.follower.senderId} = ${currentUserId}
          AND ${schema.follower.recipientId} = ${schema.user.id}
      )`.as("isFollowing"),
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
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
    // Convert the numeric isFollowing result to boolean
    const followersWithBooleanIsFollowing = followers.map((follower) => ({
      ...follower,
      isFollowing: Boolean(follower.isFollowing),
    }));

    return followersWithBooleanIsFollowing;
  }

  @handleDatabaseErrors
  async paginateFollowingSelf(
    userId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    const followerTable = aliasedTable(schema.follower, "followerTable");
    const followRequestTable = aliasedTable(
      schema.followRequest,
      "followRequestTable",
    );

    return await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
        CASE
          WHEN ${followerTable.id} IS NOT NULL THEN 'following'
          WHEN ${followRequestTable.id} IS NOT NULL THEN 'followRequestSent'
          ELSE 'notFollowing'
        END
      `,
        createdAt: schema.follower.createdAt,
      })
      .from(schema.follower)
      .innerJoin(schema.user, eq(schema.follower.recipientId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .leftJoin(
        followerTable,
        and(
          eq(followerTable.senderId, userId),
          eq(followerTable.recipientId, schema.user.id),
        ),
      )
      .leftJoin(
        followRequestTable,
        and(
          eq(followRequestTable.senderId, userId),
          eq(followRequestTable.recipientId, schema.user.id),
        ),
      )
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
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async paginateFollowingOthers(
    forUserId: string,
    currentUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    const followers = await this.db
      .select({
        userId: schema.user.id,
        profileId: schema.profile.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        privacy: schema.user.privacySetting,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follower.createdAt,
        isFollowing: sql<number>`EXISTS (
        SELECT 1 FROM ${schema.follower}
        WHERE ${schema.follower.senderId} = ${currentUserId}
          AND ${schema.follower.recipientId} = ${schema.user.id}
      )`.as("isFollowing"),
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
        ),
      )
      .orderBy(asc(schema.follower.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);

    // Convert the numeric isFollowing result to boolean
    const followersWithBooleanIsFollowing = followers.map((follower) => ({
      ...follower,
      isFollowing: Boolean(follower.isFollowing),
    }));

    return followersWithBooleanIsFollowing;
  }

  @handleDatabaseErrors
  async paginateFollowRequests(
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
