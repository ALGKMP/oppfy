import { trpcValidators } from "@acme/validators";
import Services from ".";
import repositories from "../repositories";
import { z } from "zod";

const UserService = {
  createUser: async (userId: string) => {
    try {
      if (await UserService.userExists(userId)) {
        throw new Error("User already exists.");
      }
      await repositories.user.createUserWithProfileAndNotifications(userId); // Updated repository access
    } catch (error) {
      console.error(
        `Error creating user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to create user.");
    }
  },

  getUser: async (userId: string) => {
    try {
      const user = await repositories.user.getUser(userId); // Updated repository access
      if (!user) {
        throw new Error(`Unable to retrieve user with id ${userId}`);
      }
      return user;
    } catch (error) {
      console.error(
        `Error retrieving user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to retrieve user.");
    }
  },

  getUsername : async (userId:string) => {
    try {
      const user = await Services.user.getUser(userId);
      if (!user.username) {
        throw new Error(`User ${userId} does not have a username.`);
      }
      return user.username;
    } catch (error) {
      console.error(
        `Error retrieving user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to retrieve user.");
    }
  
  },

  deleteUser: async (userId: string) => {
    try {
      await repositories.user.deleteUser(userId); // Updated repository access
    } catch (error) {
      console.error(
        `Error deleting user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to delete user.");
    }
  },

  updateUserUsername: async (userId: string, newName: string) => {
    try {
      await repositories.user.updateUsername(userId, newName); // Updated repository access
    } catch (error) {
      console.error(
        `Error updating username for user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to update username.");
    }
  },

  userExists: async (userId: string) => {
    try {
      const user = await repositories.user.getUser(userId); // Updated repository access
      return !!user;
    } catch (error) {
      console.error(
        `Error checking existence of user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to check user existence.");
    }
  },

  userHasProfile: async (userId: string) => {
    try {
      const user = await repositories.user.getUser(userId); // Updated repository access
      return !!user?.profile;
    } catch (error) {
      console.error(
        `Error checking user profile for ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to check if user has a profile.");
    }
  },

  addProfile: async (userId: string, profileId: number) => {
    try {
      await repositories.user.updateProfile(userId, profileId); // Updated repository access
    } catch (error) {
      console.error(
        `Error adding profile ${profileId} to user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to add profile to user.");
    }
  },

  getUserFromProfileId: async (profileId: number) => {
    try {
      return await repositories.user.getUserByProfileId(profileId);
    } catch (error) {
      console.error(
        `Error getting user from profile id ${profileId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to get user from profile id.");
    }
  },

  userOnboardingCompleted : async (userId: string) => {
    try {
      const profile = await Services.profile.getUserProfile(userId);
      const user = await Services.user.getUser(userId);
      return !!profile.dateOfBirth && !!profile.name && !!user.username;
    } catch (error) {
      console.error(
        "Error checking if profile has name:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to check if profile has name.");
    }
  },

  changeUserPrivacySetting: async (userId: string, newSetting: "public" | "private") => {
    try {
      await repositories.user.updatePrivacySetting(userId, newSetting); // Updated repository access
    } catch (error) {
      console.error(
        `Error changing privacy setting for user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to change privacy setting.");
    }
  },

  getUserNotificationSettings: async (userId: string) => {
    try {
      const user = await Services.user.getUser(userId);
      const notificationSettings = await repositories.notificationSetting.getNotificationSettings(user.notificationSetting);
      if (!notificationSettings) {
        throw new Error(`Unable to retrieve notification settings for user ${userId}`);
      }
      return notificationSettings;
    } catch (error) {
      console.error(
        `Error getting notification settings for user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to get notification settings.");
    }
  },

  // Should work 
  updateNotificationSettings: async (userId: string, settings: z.infer<typeof trpcValidators.user.updateNotificationSettings>) => {
    try {
      const currentSettings = await Services.user.getUserNotificationSettings(userId);

      // Iterate over each setting and update if necessary
      for (const key of Object.keys(settings) as (keyof typeof settings)[]) {
        // Only call the update function if the new setting value differs from the current setting value
        if (settings[key] !== currentSettings[key]) {
            await repositories.notificationSetting.updateNotificationSetting(currentSettings.id, key, settings[key]);
            console.log(`Updated ${key} from ${currentSettings[key]} to ${settings[key]}.`);
        } else {
            console.log(`No change needed for ${key}.`);
        }
    }
    } catch (error) {
      console.error(
        `Error updating notification settings for user ${userId}:`,
        error instanceof Error ? error.message : error
      );
      throw new Error("Failed to update notification settings.");
    }
}


};

export default UserService;
