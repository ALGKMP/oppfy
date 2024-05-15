import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class ProfileRepository {
  private db = db;

  @handleDatabaseErrors
  async getProfile(profileId: number) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
    });
  }

  @handleDatabaseErrors
  async updateFullName(profileId: number, newName: string) {
    return await this.db
      .update(schema.profile)
      .set({ fullName: newName })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async updateDateOfBirth(profileId: number, newDateOfBirth: Date) {
    return await this.db
      .update(schema.profile)
      .set({ dateOfBirth: newDateOfBirth })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async updateBio(profileId: number, newBio: string) {
    return await this.db
      .update(schema.profile)
      .set({ bio: newBio })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async getProfilePicture(profileId: number) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
      with: {
        profilePicture: true,
      }
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
  async updateUsername(profileId: number, username: string) {
    return await this.db
      .update(schema.profile)
      .set({ username })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async usernameExists(username: string) {
    return await this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username),
    });
  }
}
