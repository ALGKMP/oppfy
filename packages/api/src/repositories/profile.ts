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
  async createProfile() {
    return await this.db.insert(schema.profile).values({});
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
  async deleteProfile(profileId: number) {
    return await this.db
      .delete(schema.profile)
      .where(eq(schema.profile.id, profileId));
  }
}
