import { and, eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class FollowerRepository {
  private db = db;

  @handleDatabaseErrors
  async addFollower(userId: string, followerId: string) {
    return await this.db
      .insert(schema.follower)
      .values({ followedId: userId, followerId });
  }

  @handleDatabaseErrors
  async removeFollower(userId: string, followerId: string) {
    await this.db
      .delete(schema.follower)
      .where(
        and(
          eq(schema.follower.followedId, userId),
          eq(schema.follower.followerId, followerId),
        ),
      );
  }

  @handleDatabaseErrors
  async getFollowers(userId: string) {
    return await this._getFollowers(userId);
  }

  @handleDatabaseErrors
  async followerCount(userId: string) {
    const followers = await this._getFollowers(userId);
    return followers.length;
  }

  @handleDatabaseErrors
  async followingCount(userId: string) {
    const following = await this.db.query.follower.findMany({
      where: eq(schema.follower.followerId, userId),
    });
    return following.length;
  }

  @handleDatabaseErrors
  private async _getFollowers(userId: string) {
    return await this.db.query.follower.findMany({
      where: eq(schema.follower.followedId, userId),
    });
  }
}
