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
  async getProfilePictureByKey(key: string) {
    return await this.db.query.profilePicture.findFirst({
      where: eq(schema.profilePicture.key, key),
    });
  }

  @handleDatabaseErrors
  async updateProfilePicture(profilePictureId: number, newKey: string) {
    await this.db
      .update(schema.profilePicture)
      .set({ key: newKey })
      .where(eq(schema.profilePicture.id, profilePictureId));
  }

  @handleDatabaseErrors
  async removeProfilePicture(profilePictureId: number) {
    await this.db
      .update(schema.profilePicture)
      .set({ key: "profile-pictures/default.jpg" })
      .where(eq(schema.profilePicture.id, profilePictureId));
  }
}
