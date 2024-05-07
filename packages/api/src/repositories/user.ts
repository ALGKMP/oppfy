import { and, eq } from "drizzle-orm";

import { asc, db, gt, or, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";
import { auth } from "../utils/firebase";

export type PrivacySetting = "public" | "private";

export class UserRepository {
  private db = db;
  private auth = auth;

  @handleDatabaseErrors
  async createUser(userId: string) {
    await this.db.transaction(async (tx) => {
      // Create an empty profile picture entry for the user
      const profilePicture = await tx
        .insert(schema.profilePicture)
        .values({})
        .execute();

      // Create an empty profile for the user, ready to be updated later
      const profile = await tx
        .insert(schema.profile)
        .values({
          profilePictureId: profilePicture[0].insertId, // Attach the profile picture ID
          // Other fields are left empty and to be filled later
        })
        .execute();

      // Create default notification settings for the user
      const notificationSetting = await tx
        .insert(schema.notificationSettings)
        .values({})
        .execute();

      // Create the user with the profileId and notificationSettingId
      await tx
        .insert(schema.user)
        .values({
          id: userId,
          profileId: profile[0].insertId,
          notificationSettingsId: notificationSetting[0].insertId,
        })
        .execute();
    });
  }

  @handleDatabaseErrors
  async getUser(userId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    });
  }

  @handleDatabaseErrors
  async getProfile(profileId: number) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
    });
  }

  @handleDatabaseErrors
  async addProfile(userId: string, profileId: number) {
    await this.db
      .update(schema.user)
      .set({ profileId })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async updateUsername(userId: string, username: string) {
    return await this.db
      .update(schema.user)
      .set({ username })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async usernameExists(username: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.username, username),
    });
  }

  @handleDatabaseErrors
  async deleteUser(userId: string) {
    // TODO: This needs to handle failed states
    await this.db.delete(schema.user).where(eq(schema.user.id, userId));
    await this.auth.deleteUser(userId);
  }

  @handleDatabaseErrors
  async updatePrivacySetting(
    userId: string,
    newPrivacySetting: PrivacySetting,
  ) {
    return await this.db
      .update(schema.user)
      .set({ privacySetting: newPrivacySetting })
      .where(eq(schema.user.id, userId));
  }

  /* 
   * TODO: Use dynamic queries here - no acces to docs while on a plan.
   * 1. dynamic query for the cursor pagination.
   * 2. table as a parameter solves duplicated code for joins.
  */

  @handleDatabaseErrors
  async getPaginatedFollowers(cursor: string, pageSize = 10) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.user.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profilePicture.key,
      })
      .from(schema.user)
      .fullJoin(schema.follower, eq(schema.user.id, schema.follower.recipientId))
      .fullJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .fullJoin(
        schema.profilePicture,
        eq(schema.profile.profilePictureId, schema.profilePicture.id),
      )
      .where(cursor ? gt(schema.user.id, cursor) : undefined)
      .orderBy(asc(schema.user.createdAt))
      .limit(pageSize);
  }

  @handleDatabaseErrors
  async getPaginatedFollowing(cursor: string, pageSize = 10) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.user.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profilePicture.key,
      })
      .from(schema.user)
      .fullJoin(schema.follower, eq(schema.user.id, schema.follower.senderId))
      .fullJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .fullJoin(
        schema.profilePicture,
        eq(schema.profile.profilePictureId, schema.profilePicture.id),
      )
      .where(cursor ? gt(schema.user.id, cursor) : undefined)
      .orderBy(asc(schema.user.createdAt))
      .limit(pageSize);
  }

  @handleDatabaseErrors
  async getPaginatedFriends(cursor: string, pageSize = 10) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.user.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profilePicture.key,
      })
      .from(schema.user)
      .fullJoin(
        schema.friend,
        or(
          eq(schema.user.id, schema.friend.userId1),
          eq(schema.user.id, schema.friend.userId2),
        ),
      )
      .fullJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .fullJoin(
        schema.profilePicture,
        eq(schema.profile.profilePictureId, schema.profilePicture.id),
      )
      .where(cursor ? gt(schema.user.id, cursor) : undefined)
      .orderBy(asc(schema.user.createdAt))
      .limit(pageSize);
  }

  @handleDatabaseErrors
  async getPaginatedFollowRequests(cursor: string, pageSize = 10) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.user.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profilePicture.key,
      })
      .from(schema.user)
      .fullJoin(
        schema.followRequest,
        eq(schema.user.id, schema.followRequest.recipientId),
      )
      .fullJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .fullJoin(
        schema.profilePicture,
        eq(schema.profile.profilePictureId, schema.profilePicture.id),
      )
      .where(cursor ? gt(schema.user.id, cursor) : undefined)
      .orderBy(asc(schema.user.createdAt))
      .limit(pageSize);
  }

  @handleDatabaseErrors
  async getPaginatedFriendRequests(cursor: string, pageSize = 10) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.user.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profilePicture.key,
      })
      .from(schema.user)
      .fullJoin(
        schema.friendRequest,
        eq(schema.user.id, schema.friendRequest.recipientId),
      )
      .fullJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .fullJoin(
        schema.profilePicture,
        eq(schema.profile.profilePictureId, schema.profilePicture.id),
      )
      .where(cursor ? gt(schema.user.id, cursor) : undefined)
      .orderBy(asc(schema.user.createdAt))
      .limit(pageSize);
  }

  // Use this to check if a user is blocked (gonna need to use this a lot)
  @handleDatabaseErrors
  async getBlockedUser(userId: string, blockedUserId: string) {
    return await this.db.query.block.findFirst({
      // checking both sides (it's the same render on the client. You can only unblock in settings so we can do this)
      where: or(
        and(
          eq(schema.block.userId, userId),
          eq(schema.block.blockedUserId, blockedUserId),
        ),
        and(
          eq(schema.block.blockedUserId, userId),
          eq(schema.block.userId, blockedUserId),
        ),
      ),
    });
  }

  // Should I remove all other relationships here, or do that in the service... prob services, that's business logic
  @handleDatabaseErrors
  async blockUser(userId: string, blockedUserId: string) {
    const blockedUser = await this.db.insert(schema.block).values({
      userId,
      blockedUserId,
    });
    return blockedUser[0];
  }

  @handleDatabaseErrors
  async unblockUser(userId: string, blockedUserId: string) {
    const result = await this.db
      .delete(schema.block)
      .where(
        and(
          eq(schema.block.userId, userId),
          eq(schema.block.blockedUserId, blockedUserId),
        ),
      );
    return result[0];
  }
}
