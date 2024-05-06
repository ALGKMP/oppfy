import { and, eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class FollowerRepository {
  private db = db;

  @handleDatabaseErrors
  async addFollower(userId: string, followedId: string) {
    const result = await this.db
      .insert(schema.follower)
      .values({ followedId, followerId: userId });
    return result[0];
  }

  @handleDatabaseErrors
  async removeFollower(userId: string, followerId: string) {
    const result = await this.db
      .delete(schema.follower)
      .where(
        and(
          eq(schema.follower.followedId, followerId),
          eq(schema.follower.followerId, userId),
        ),
      );
    return result[0]; // TODO: this feels wierd, I though this returned a delete marker
  }

  @handleDatabaseErrors
  async getFollower(followerId: string, followedId: string) {
    return await this.db.query.follower.findFirst({
      where: and(
        eq(schema.follower.followerId, followerId),
        eq(schema.follower.followedId, followedId),
      ),
    });
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

  @handleDatabaseErrors
  async followRequest(requesterId: string, requestedId: string) {
    const result = await this.db
      .insert(schema.followRequest)
      .values({ requesterId, requestedId});
      return result[0];
  }
}
