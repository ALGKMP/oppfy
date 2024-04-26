import { eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const ProfilePhotoRepository = {
  createProfilePhoto: async (key: string) => {
    const result = await db
      .insert(schema.profilePhoto)
      .values({ key })
      .execute();
    return result[0].insertId;
  },

  updateProfilePhotoKey: async (profilePhotoId: number, newKey: string) => {
    await db
      .update(schema.profilePhoto)
      .set({ key: newKey })
      .where(eq(schema.profilePhoto.id, profilePhotoId));
  },

  getProfilePhoto: async (profilePhotoId: number) => {
    const profilePhotos = await db
      .select()
      .from(schema.profilePhoto)
      .where(eq(schema.profilePhoto.id, profilePhotoId));
    return profilePhotos.length > 0 ? profilePhotos[0] : null;
  },
  
  addProfilePhotoToProfile: async (profileId: number, profilePhotoId: number) => {
    return await db
      .update(schema.profile)
      .set({ profilePhoto: profilePhotoId })
      .where(eq(schema.profile.id, profileId));
  },

  deleteProfilePhoto: async (profilePhotoId: number) => {
    return await db
      .delete(schema.profilePhoto)
      .where(eq(schema.profilePhoto.id, profilePhotoId));
  }
};

export default ProfilePhotoRepository;
