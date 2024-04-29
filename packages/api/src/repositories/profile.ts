// src/repositories/ProfileRepository.ts
import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const profileRepository = {
  // Function to create a profile
  createProfile: async () => {
    const result = await db.insert(schema.profile).values({}).execute();
    return result[0].insertId;
  },

  // Function to retrieve a profile by its ID
  getProfile: async (profileId: number) => {
    const profiles = await db
      .select()
      .from(schema.profile)
      .where(eq(schema.profile.id, profileId));
    return profiles.length > 0 ? profiles[0] : null;
  },

  // Function to update the name of a profile
  updateProfileName: async (profileId: number, newName: string) => {
    await db
      .update(schema.profile)
      .set({ name: newName })
      .where(eq(schema.profile.id, profileId));
  },

  // Function to update the date of birth of a profile
  updateProfileDateOfBirth: async (profileId: number, newDateOfBirth: Date) => {
    await db
      .update(schema.profile)
      .set({ dateOfBirth: newDateOfBirth })
      .where(eq(schema.profile.id, profileId));
  },

  // Function to delete a profile
  deleteProfile: async (profileId: number) => {
    await db.delete(schema.profile).where(eq(schema.profile.id, profileId));
  },
};

export default profileRepository;
