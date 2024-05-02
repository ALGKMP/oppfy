import Services from ".";
import repositories from "../repositories";
import UserService from "./user";

const ProfileService = {
  createProfile: async (userId: string) => {
    try {
      if (await UserService.userHasProfile(userId)) {
        throw new Error("User already has a profile.");
      }

      const profileId = await repositories.profile.createProfile(); // Updated repository access
      await UserService.addProfile(userId, profileId);
      await Services.profile.createAndLinkProfilePicture(profileId);

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

  getProfileById: async (profileId: number) => {
    try {
      const profile = await repositories.profile.getProfile(profileId); // Updated repository access
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

  getUserProfile: async (userId: string) => {
    try {
      const user = await UserService.getUser(userId);
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

  updateFullName: async (userId: string, name: string) => {
    try {
      const profile = await ProfileService.getUserProfile(userId);
      await repositories.profile.updateProfileName(profile.id, name); // Updated repository access
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
      const profile = await ProfileService.getUserProfile(userId);
      await repositories.profile.updateProfileDateOfBirth(
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

  uploadProfilePicture: async (userId: string) => {
    try {
      const profile = await ProfileService.getUserProfile(userId);

      // New Profile Photo
      if (!profile.profilePhoto) {
        return await ProfileService.createAndLinkProfilePicture(profile.id);
      }

      const profilePhoto = await repositories.profilePhoto.getProfilePhoto(
        profile.profilePhoto,
      );

      if (!profilePhoto) {
        throw new Error("Profile photo does not exist.");
      }

      return await repositories.profilePhoto.updateProfilePhoto(
        profilePhoto.id,
        userId
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
      const user = await repositories.user.getUserByProfileId(profileId);
      if (!user) {
        throw new Error("User not found");
      }

      const key = `profile-pictures/${user.id}.jpg`;

      return await repositories.profilePhoto.createProfilePhoto(key);
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
    let key = `profile-pictures/${userId}.jpg`;

    const profile = await Services.profile.getUserProfile(userId);
    if (!profile.profilePhoto) {
      key = `profile-pictures/default.jpg`
    }

    try {
      return await Services.aws.objectPresignedUrl(bucket, key);
    } catch (err) {
      console.error(`Error retrieving object: ${key}`, err);
      throw new Error(`Failed to retrieve object from S3 for user ${userId}`);
    }
  },

  // Batch get operation for multiple profile pictures
  getProfilePictureBatch: async (
    userIds: string[],
  ): Promise<Record<string, string | null>> => {
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
      const profile = await ProfileService.getUserProfile(userId);
      if (!profile.profilePhoto) {
        throw new Error("Profile does not have a profile photo.");
      }
      
      const bucket = process.env.S3_BUCKET_NAME!;
      const key = `profile-pictures/${userId}.jpg`;
      const deleted = await Services.aws.deleteObject(bucket, key);

      if (!deleted.DeleteMarker) {
        throw new Error("Failed to delete profile photo from S3.");
      }

      return await repositories.profilePhoto.deleteProfilePhoto(profile.profilePhoto);
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
