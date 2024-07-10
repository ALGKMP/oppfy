import { eq, inArray } from "drizzle-orm";

import { db, schema } from "@oppfy/db";

import { handleDatabaseErrors } from "../../errors";

export class ProfileRepository {
  private db = db;

  @handleDatabaseErrors
  async getProfileByProfileId(profileId: number) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
    });
  }

  @handleDatabaseErrors
  async getProfileByUserId(userId: string) {
    return await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: { profile: true },
    });
  }

  @handleDatabaseErrors
  async updateProfile(
    profileId: number,
    update: Partial<typeof schema.profile.$inferInsert>,
  ) {
    return await this.db
      .update(schema.profile)
      .set(update)
      .where(eq(schema.profile.id, profileId));

      
  }

  @handleDatabaseErrors
  async getProfilePicture(profileId: number) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
      with: {
        profilePicture: true,
      },
    });
  }

  @handleDatabaseErrors
  async getProfilePictureByKey(key: string) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.profilePictureKey, key),
    });
  }

  @handleDatabaseErrors
  async updateProfilePicture(profileId: number, newKey: string) {
    await this.db
      .update(schema.profile)
      .set({ profilePictureKey: newKey })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async removeProfilePicture(profileId: number) {
    await this.db
      .update(schema.profile)
      .set({ profilePictureKey: "profile-pictures/default.jpg" })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async usernameExists(username: string) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username),
    });
  }

  @handleDatabaseErrors
  async getBatchProfiles(userIds: string[]) {
    const user = schema.user;
    const profile = schema.profile;
    const fullProfiles = await db
      .select({
        userId: user.id,
        profileId: profile.id,
        privacy: user.privacySetting,
        username: profile.username,
        fullName: profile.fullName,
        profilePictureKey: profile.profilePictureKey,
      })
      .from(schema.user)
      .innerJoin(profile, eq(user.profileId, profile.id))
      .where(inArray(user.id, userIds));

    return fullProfiles;
  }
}
