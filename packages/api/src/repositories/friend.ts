import { and, eq, or } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class FriendRepository {
  private db = db;

  @handleDatabaseErrors
  async addFriend(userId1: string, userId2: string) {
    return await this.db
      .insert(schema.friend)
      .values({ userId1, userId2 })
      .execute();
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
  async friendsCount(userId: string) {
    const friends = await this._getFriends(userId);
    return friends.length;
  }

  @handleDatabaseErrors
  private async _getFriends(userId: string) {
    return await this.db.query.friend.findMany({
      where: or(
        eq(schema.friend.userId1, userId),
        eq(schema.friend.userId2, userId),
      ),
    });
  }

  @handleDatabaseErrors
  async createFriendRequest(requesterId: string, requestedId: string) {
    const result = await this.db
      .insert(schema.friendRequest)
      .values({ requesterId, requestedId })
      .execute();
    return result[0];
  }

  @handleDatabaseErrors
  async deleteFriendRequest(requesterId: string, requestedId: string) {
    const result = await this.db
      .delete(schema.friendRequest)
      .where(
        and(
          eq(schema.friendRequest.requesterId, requesterId),
          eq(schema.friendRequest.requestedId, requestedId),
        ),
      );
    return result[0];
  }

  @handleDatabaseErrors
  async getFriendRequest(requesterId: string, requestedId: string) {
    return await this.db.query.friendRequest.findFirst({
      where: and(
        eq(schema.friendRequest.requesterId, requesterId),
        eq(schema.friendRequest.requestedId, requestedId),
      ),
    });
  }

  @handleDatabaseErrors
  async getPendingRequests(userId: string) {
    return await this.db
      .select()
      .from(schema.friendRequest)
      .where(
        and(
          eq(schema.friendRequest.requestedId, userId),
        ),
      );
  }
}
