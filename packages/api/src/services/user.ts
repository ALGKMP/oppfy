import repositories from "../repositories";

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
      const user = await repositories.user.getUser(userId);
      if (!user) {
        throw new Error(`Unable to retrieve user with id ${userId}`);
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
};

export default UserService;
