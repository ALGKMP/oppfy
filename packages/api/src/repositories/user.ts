import { and, eq } from "drizzle-orm";

import { asc, db, gt, or, schema } from "@oppfy/db";
import type { InferInsertModel } from "@oppfy/db/";

import { handleDatabaseErrors } from "../errors";
import { auth } from "../utils/firebase";

export type PrivacySetting = NonNullable<
  InferInsertModel<typeof schema.user>["privacySetting"]
>;
export class UserRepository {
  private db = db;
  private auth = auth;

  @handleDatabaseErrors
  async createUser(userId: string) {
    await this.db.transaction(async (tx) => {
      // Create an empty profile for the user, ready to be updated later
      const profile = await tx.insert(schema.profile).values({});

      // Create default notification settings for the user
      const notificationSetting = await tx
        .insert(schema.notificationSettings)
        .values({});

      // Create the user with the profileId and notificationSettingId
      await tx.insert(schema.user).values({
        id: userId,
        profileId: profile[0].insertId,
        notificationSettingsId: notificationSetting[0].insertId,
      });
    });
  }

  @handleDatabaseErrors
  async getUser(userId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
    });
  }

  @handleDatabaseErrors
  async getUserByProfileId(profileId: number) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.profileId, profileId),
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

  @handleDatabaseErrors
  async getPaginatedFollowers(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follower.createdAt,
        profileId: schema.profile.id,
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
  async getPaginatedFollowing(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.follower.createdAt,
        profileId: schema.profile.id,
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
  }

  @handleDatabaseErrors
  async getPaginatedFriends(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
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
      .innerJoin(
        schema.user,
        or(
          eq(schema.friend.userId1, schema.user.id),
          eq(schema.friend.userId2, schema.user.id),
        ),
      )
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        or(
          eq(schema.friend.userId1, forUserId),
          eq(schema.friend.userId2, forUserId),
          cursor
            ? or(
                gt(schema.friend.createdAt, cursor.createdAt),
                and(
                  eq(schema.friend.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(asc(schema.friend.createdAt), asc(schema.profile.id))
      .limit(pageSize + 1);
  }

  @handleDatabaseErrors
  async getPaginatedBlockedUsers(
    forUserId: string,
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.block.createdAt, // Assuming block has a createdAt column
        profileId: schema.profile.id, // Ensuring we select this for the cursor and tie-breaking
      })
      .from(schema.user)
      .innerJoin(schema.block, eq(schema.user.id, schema.block.blockedUserId))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.block.userId, forUserId), // Filtering for the specific user who blocked others
          cursor
            ? or(
                gt(schema.block.createdAt, cursor.createdAt),
                and(
                  eq(schema.block.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(schema.block.createdAt), // Primary order by the creation date
        asc(schema.profile.id), // Tiebreaker order by profile ID
      )
      .limit(pageSize + 1); // Get an extra item at the end which we'll use as next cursor
  }

  @handleDatabaseErrors
  async getPaginatedFollowRequests(
    forUserId: string, // Assuming you need this to identify the recipient of follow requests
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.followRequest.createdAt, // Assuming followRequest has a createdAt column
        profileId: schema.profile.id, // Ensuring we select this for the cursor and tie-breaking
      })
      .from(schema.followRequest)
      .innerJoin(
        schema.user,
        eq(schema.followRequest.recipientId, schema.user.id),
      )
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.followRequest.recipientId, forUserId), // Filtering for the specific user receiving follow requests
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
      .orderBy(
        asc(schema.followRequest.createdAt), // Primary order by the creation date of the follow request
        asc(schema.profile.id), // Tiebreaker order by profile ID
      )
      .limit(pageSize + 1); // Get an extra item at the end which we'll use as next cursor
  }

  @handleDatabaseErrors
  async getPaginatedFriendRequests(
    forUserId: string, // Assuming you need this to identify the recipient of friend requests
    cursor: { createdAt: Date; profileId: number } | null = null,
    pageSize = 10,
  ) {
    return await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.fullName,
        profilePictureUrl: schema.profile.profilePictureKey,
        createdAt: schema.friendRequest.createdAt, // Assuming friendRequest has a createdAt column
        profileId: schema.profile.id, // Ensuring we select this for the cursor and tie-breaking
      })
      .from(schema.friendRequest)
      .innerJoin(
        schema.user,
        eq(schema.friendRequest.recipientId, schema.user.id),
      )
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .where(
        and(
          eq(schema.friendRequest.recipientId, forUserId), // Filtering for the specific user receiving friend requests
          cursor
            ? or(
                gt(schema.friendRequest.createdAt, cursor.createdAt),
                and(
                  eq(schema.friendRequest.createdAt, cursor.createdAt),
                  gt(schema.profile.id, cursor.profileId),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(
        asc(schema.friendRequest.createdAt), // Primary order by the creation date of the friend request
        asc(schema.profile.id), // Tiebreaker order by profile ID
      )
      .limit(pageSize + 1); // Get an extra item at the end which we'll use as next cursor
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
