import Services from ".";
import Repositories from "../repositories";
import UserService from "./user";

const ProfileService = {
  createProfile: async (userId: string) => {
    try {
      if (await UserService.userHasProfile(userId)) {
        throw new Error("User already has a profile.");
      }

      const profileId = await Repositories.profile.createProfile(); // Updated repository access
      await UserService.addProfile(userId, profileId);
      return profileId;
    } catch (error) {
      console.error(
        "Error creating profile for user:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to create profile for user.");
    }
  },

  getProfileByUserId: async (userId: string) => {
    try {
      const user = await UserService.getUser(userId);
      if (!user?.profile) {
        throw new Error("User does not have an associated profile.");
      }
      return await ProfileService.getProfileById(user.profile);
    } catch (error) {
      console.error(
        "Error retrieving profile by user ID:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to retrieve profile by user ID.");
    }
  },

  getProfileById: async (profileId: number) => {
    try {
      const profile = await Repositories.profile.getProfile(profileId); // Updated repository access
      if (!profile) {
        throw new Error("Profile does not exist.");
      }
      return profile;
    } catch (error) {
      console.error(
        "Error getting profile:",
        profileId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to retrieve profile.");
    }
  },

  updateName: async (userId: string, name: string) => {
    try {
      const profile = await ProfileService.getProfileByUserId(userId);
      await Repositories.profile.updateProfileName(profile.id, name); // Updated repository access
    } catch (error) {
      console.error(
        "Error updating profile name:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to update profile name.");
    }
  },

  updateDateOfBirth: async (userId: string, dateOfBirth: Date) => {
    try {
      const profile = await ProfileService.getProfileByUserId(userId);
      await Repositories.profile.updateProfileDateOfBirth(
        profile.id,
        dateOfBirth,
      ); // Updated repository access
    } catch (error) {
      console.error(
        "Error updating profile date of birth:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to update profile date of birth.");
    }
  },

  profileHasName: async (userId: string) => {
    try {
      const profile = await ProfileService.getProfileByUserId(userId);
      return !!profile.name;
    } catch (error) {
      console.error(
        "Error checking if profile has name:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to check if profile has name.");
    }
  },

  profileHasDateOfBirth: async (userId: string) => {
    try {
      const profile = await ProfileService.getProfileByUserId(userId);
      return !!profile.dateOfBirth;
    } catch (error) {
      console.error(
        "Error checking if profile has date of birth:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to check if profile has date of birth.");
    }
  },

  uploadProfilePicture: async (userId: string, key: string) => {
    try {
      const profile = await ProfileService.getProfileByUserId(userId);

      // New Profile Photo
      if (!profile.profilePhoto) {
        return await ProfileService.createAndLinkProfilePicture(profile.id);
      }

      const profilePhoto = await Repositories.profilePhoto.getProfilePhoto(
        profile.profilePhoto,
      );

      if (!profilePhoto) {
        throw new Error("Profile photo does not exist.");
      }

      return await Repositories.profilePhoto.updateProfilePhotoKey(
        profilePhoto.id,
        key,
      );
    } catch (error) {
      console.error(
        "Error uploading profile photo:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to upload profile photo.");
    }
  },

  createAndLinkProfilePicture: async (profileId: number) => {
    try {
      const user = await Repositories.user.getUserByProfileId(profileId);
      if (!user) {
        throw new Error("User not found");
      }

      const key = `profile-pictures/${user.id}.jpg`;

      return await Repositories.profilePhoto.createProfilePhoto(key);
    } catch (error) {
      console.error(
        "Error creating and linking profile photo:",
        profileId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to create and link profile photo.");
    }
  },

  // for current user
  getUserProfilePicture: async (userId: string): Promise<string> => {
    const bucket = process.env.S3_BUCKET_NAME!;
    const key = `profile-pictures/${userId}.jpg`;
    try {
      return await Services.aws.objectPresignedUrl(bucket, key);
    } catch (err) {
      console.error(`Error retrieving object: ${key}`, err);
      throw new Error(`Failed to retrieve object from S3 for user ${userId}`);
    }
  },

  // for other users
  getProfilePicture: async (userId: string): Promise<string> => {
    const bucket = process.env.S3_BUCKET_NAME!;
    const key = `profile-pictures/${userId}.jpg`;
    try {
      return await Services.aws.objectPresignedUrl(bucket, key);
    } catch (err) {
      console.error(`Error retrieving object: ${key}`, err);
      throw new Error(`Failed to retrieve object from S3 for user ${userId}`);
    }
  },

  // Batch get operation for multiple profile pictures
  getProfilePictureBatch: async (userIds: string[]): Promise<Record<string, string | null>> => {
    const bucket = process.env.S3_BUCKET_NAME!;
    const result: Record<string, string | null> = {};

    const urlPromises = userIds.map(async (userId) => {
      try {
        const url = await Services.aws.objectPresignedUrl(
          bucket,
          `profile-pictures/${userId}.jpg`,
        );
        result[userId] = url;
      } catch (err) {
        console.error(
          `Error retrieving object: profile-pictures/${userId}.jpg`,
          err,
        );
        return `Failed to retrieve object from S3 for user ${userId}`;
      }
    });
    await Promise.all(urlPromises);
    return result;
  },

  deleteProfilePicture: async (userId: string) => {
    try {
      const profile = await ProfileService.getProfileByUserId(userId);
      if (!profile.profilePhoto) {
        throw new Error("Profile does not have a profile photo.");
      }

      // Throws if fails
      await Repositories.profilePhoto.deleteProfilePhoto(profile.profilePhoto);

      // Update profile to remove profile photo
      const bucket = process.env.S3_BUCKET_NAME!;
      const key = `profile-pictures/${userId}.jpg`;
      return await Services.aws.deleteObject(bucket, key);
    } catch (error) {
      console.error(
        "Error deleting profile photo:",
        userId,
        error instanceof Error ? error.message : error,
      );
      throw new Error("Failed to delete profile photo.");
    }
  },
};

export default ProfileService;
