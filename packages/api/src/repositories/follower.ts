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
  async getFollower(followerId: string, followedId: string) {
    await this.db.query.follower.findFirst({
      where: and(eq(schema.follower.followerId, followerId), eq(schema.follower.followedId, followedId))
    })
  }

  @handleDatabaseErrors
  async countFollowers(userId: string) {
    const followers = await this._getFollowers(userId);
    return followers.length;
  }

  @handleDatabaseErrors
  async countFollowing(userId: string) {
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
