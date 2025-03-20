import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
} from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class ProfileRepository {
  private db = db;

  @handleDatabaseErrors
  async getProfile({ profileId }: { profileId: string }) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
    });
  }

  @handleDatabaseErrors
  async getUserProfile({ userId }: { userId: string }) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: { profile: true },
    });
  }

  @handleDatabaseErrors
  async getUserFullProfile({ userId }: { userId: string }) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: { profile: { with: { user: true, profileStats: true } } },
    });
  }

  @handleDatabaseErrors
  async getProfileByUsername({ username }: { username: string }) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username),
    });
  }

  @handleDatabaseErrors
  async updateProfile({
    profileId,
    update,
  }: {
    profileId: string;
    update: Partial<typeof schema.profile.$inferInsert>;
  }) {
    return await this.db
      .update(schema.profile)
      .set(update)
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async updateProfilePicture({
    profileId,
    newKey,
  }: {
    profileId: string;
    newKey: string;
  }) {
    await this.db
      .update(schema.profile)
      .set({ profilePictureKey: newKey })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async usernameExists({ username }: { username: string }) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username),
    });
  }

  @handleDatabaseErrors
  async getBatchProfiles({ userIds }: { userIds: string[] }) {
    const user = schema.user;
    const profile = schema.profile;
    const fullProfiles = await this.db
      .select({
        userId: user.id,
        profileId: profile.id,
        privacy: user.privacySetting,
        username: profile.username,
        name: profile.name,
        profilePictureKey: profile.profilePictureKey,
      })
      .from(schema.user)
      .innerJoin(profile, eq(profile.userId, user.id))
      .where(inArray(user.id, userIds));

    return fullProfiles;
  }

  @handleDatabaseErrors
  async deleteProfile({ profileId }: { profileId: string }) {
    await this.db
      .delete(schema.profile)
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async profilesByUsername({
    username,
    currentUserId,
    limit = 15,
  }: {
    username: string;
    currentUserId: string;
    limit?: number;
  }) {
    const results = await this.db
      .select({
        userId: schema.user.id,
        username: schema.profile.username,
        name: schema.profile.name,
        bio: schema.profile.bio,
        profilePictureKey: schema.profile.profilePictureKey,
      })
      .from(schema.user)
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.user.id))
      .leftJoin(
        schema.block,
        or(
          and(
            eq(schema.block.blockedByUserId, currentUserId),
            eq(schema.block.blockedUserId, schema.user.id),
          ),
          and(
            eq(schema.block.blockedByUserId, schema.user.id),
            eq(schema.block.blockedUserId, currentUserId),
          ),
        ),
      )
      .where(
        and(
          ilike(schema.profile.username, `%${username}%`),
          ne(schema.user.id, currentUserId),
          isNotNull(schema.profile.userId),
          isNull(schema.block.id),
        ),
      )
      .limit(limit);

    return results;
  }
}
