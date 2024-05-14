import { and, count, eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

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
  async countFollowing(userId: string): Promise<number | undefined>{
    const result = await this.db
      .select({ count: count() })
      .from(schema.follower)
      .where(eq(schema.follower.senderId, userId));
    return result[0]?.count;
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
}
