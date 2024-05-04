import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class ProfilePictureRepository {
  private db = db;

  @handleDatabaseErrors
  async getProfilePicture(profilePictureId: number) {
    return await this.db.query.profilePicture.findFirst({
      where: eq(schema.profilePicture.id, profilePictureId),
    });
  }

  @handleDatabaseErrors
  async storeProfilePictureKey(key: string) {
    return await this.db.insert(schema.profilePicture).values({ key });
  }

  @handleDatabaseErrors
  async updateProfilePictureKey(profilePictureId: number, newKey: string) {
    await this.db
      .update(schema.profilePicture)
      .set({ key: newKey })
      .where(eq(schema.profilePicture.id, profilePictureId));
  }

  @handleDatabaseErrors
  async addProfilePictureToProfile(
    profileId: number,
    profilePictureId: number,
  ) {
    await this.db
      .update(schema.profile)
      .set({ profilePicture: profilePictureId })
      .where(eq(schema.profile.id, profileId));
  }

  @handleDatabaseErrors
  async deleteProfilePicture(profilePictureId: number) {
    await this.db
      .delete(schema.profilePicture)
      .where(eq(schema.profilePicture.id, profilePictureId));
  }
}
