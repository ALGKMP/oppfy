import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const profilePhotoRepository = {
  createProfilePhoto: async (key: string) => {
    const result = await db
      .insert(schema.profilePicture)
      .values({ key })
      .execute();
    return result[0].insertId;
  },

  updateProfilePhoto: async (profilePhotoId: number, newKey: string) => {
    await db
      .update(schema.profilePicture)
      .set({ key: newKey })
      .where(eq(schema.profilePicture.id, profilePhotoId));
  },

  getProfilePhoto: async (profilePhotoId: number) => {
    const profilePhotos = await db
      .select()
      .from(schema.profilePicture)
      .where(eq(schema.profilePicture.id, profilePhotoId));
    return profilePhotos.length > 0 ? profilePhotos[0] : null;
  },

  addProfilePhotoToProfile: async (
    profileId: number,
    profilePhotoId: number,
  ) => {
    return await db
      .update(schema.profile)
      .set({ profilePhoto: profilePhotoId })
      .where(eq(schema.profile.id, profileId));
  },

  deleteProfilePhoto: async (profilePhotoId: number) => {
    return await db
      .delete(schema.profilePicture)
      .where(eq(schema.profilePicture.id, profilePhotoId));
  },
};

export default profilePhotoRepository;
