import { and, eq, or } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class FriendsRepository {
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
    await this.db
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
  }

  @handleDatabaseErrors
  async getFriends(userId: string) {
    return await this._getFriends(userId);
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
}
