import { and, eq, gt, or, asc, count } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class FriendRepository {
  private db = db;

  @handleDatabaseErrors
  async addFriend(userId1: string, userId2: string) {
    return await this.db.insert(schema.friend).values({ userId1, userId2 });
  }

  @handleDatabaseErrors
  async removeFriend(userId1: string, userId2: string) {
    const result = await this.db
      .delete(schema.friend)
      .where(
        or(
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
      .where(eq(schema.friend.userId1, userId));
    return result[0]?.count;
  }

  @handleDatabaseErrors
  async createFriendRequest(senderId: string, recipientId: string) {
    const result = await this.db
      .insert(schema.friendRequest)
      .values({ senderId, recipientId });
    return result[0];
  }

  @handleDatabaseErrors
  async deleteFriendRequest(senderId: string, recipientId: string) {
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
  async getFriendRequest(senderId: string, recipientId: string) {
    return await this.db.query.friendRequest.findFirst({
      where: and(
        eq(schema.friendRequest.senderId, senderId),
        eq(schema.friendRequest.recipientId, recipientId),
      ),
    });
  }

  @handleDatabaseErrors
  async paginateFriends(forUserId: string, cursor: { createdAt: Date; profileId: number } | null = null, pageSize = 10) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.friend.createdAt,
        profileId: schema.profile.id,
      })
      .from(schema.friend)
      .innerJoin(schema.user, or(eq(schema.friend.userId1, schema.user.id), eq(schema.friend.userId2, schema.user.id)))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        or(
          eq(schema.friend.userId1, forUserId),
          eq(schema.friend.userId2, forUserId),
          cursor ? or(gt(schema.friend.createdAt, cursor.createdAt), and(eq(schema.friend.createdAt, cursor.createdAt), gt(schema.profile.id, cursor.profileId))) : undefined,
        ),
      )
      .orderBy(asc(schema.friend.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }

    @handleDatabaseErrors
  async getPaginatedFriendRequests(forUserId: string, cursor: { createdAt: Date; profileId: number } | null = null, pageSize = 10) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.friendRequest.createdAt,
        profileId: schema.profile.id,
      })
      .from(schema.friendRequest)
      .innerJoin(schema.user, eq(schema.friendRequest.recipientId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.friendRequest.recipientId, forUserId),
          cursor ? or(gt(schema.friendRequest.createdAt, cursor.createdAt), and(eq(schema.friendRequest.createdAt, cursor.createdAt), gt(schema.profile.id, cursor.profileId))) : undefined,
        ),
      )
      .orderBy(asc(schema.friendRequest.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }
}
