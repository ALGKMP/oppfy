// src/repositories/UserRepository.ts
import { eq } from "drizzle-orm";
import { db, schema } from "@acme/db";

const UserRepository = {
  createUserWithProfileAndNotifications: async (userId: string) => {
    return await db.transaction(async (transactionDb) => {
      // Create the profile for the user
      const profile = await transactionDb.insert(schema.profile).values({}).execute();
      // Create default notification settings for the user
      const notificationSetting = await transactionDb
        .insert(schema.notificationSetting)
        .values({})
        .execute();
      // Create the user with the profileId and notificationSettingId
      await transactionDb
        .insert(schema.user)
        .values({
          id: userId,
          profile: profile[0].insertId,
          notificationSetting: notificationSetting[0].insertId,
        })
        .execute();
    });
  },

  getUser: async (userId: string) => {
    const users = await db
      .selectDistinct()
      .from(schema.user)
      .where(eq(schema.user.id, userId));
    return users[0];
  },

  getUserProfile: async (userId: string) => {
    const user = await UserRepository.getUser(userId);
    if (!user) {
      return null;
    }
    return await db
      .select()
      .from(schema.profile)
      .where(eq(schema.profile.id, user.profile));
  },

  getUserByUserName: async (userName: string) => {
    const users = await db
      .selectDistinct()
      .from(schema.user)
      .where(eq(schema.user.username, userName));
    return users[0];
  },

  updateProfile: async (userId: string, profileId: number) => {
    await db
      .update(schema.user)
      .set({ profile: profileId })
      .where(eq(schema.user.id, userId));
  },

  updateUsername: async (userId: string, username: string) => {
    await db
      .update(schema.user)
      .set({ username: username })
      .where(eq(schema.user.id, userId));
  },

  deleteUser: async (userId: string) => {
    await db.transaction(async (transactionDb) => {
      await transactionDb.delete(schema.user).where(eq(schema.user.id, userId));
    });
  }
};

export default UserRepository;
