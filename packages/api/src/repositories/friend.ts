import { and, count, eq, or } from "drizzle-orm";

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
  async countFriends(userId: string): Promise<number | undefined> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.friend)
      .where(eq(schema.friend.userId1, userId));
    return result[0]?.count;
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
  async createFriendRequest(senderId: string, recipientId: string) {
    const result = await this.db
      .insert(schema.friendRequest)
      .values({ senderId, recipientId })
      .execute();
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
  async getPendingRequests(senderId: string) {
    return await this.db
      .select()
      .from(schema.friendRequest)
      .where(and(eq(schema.friendRequest.senderId, senderId)));
  }
}
