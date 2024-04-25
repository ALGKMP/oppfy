import UserRepository from '../repositories/user';

const UserService = {
    createUser: async (userId: string) => {
        try {
            if (await UserService.userExists(userId)) {
                throw new Error("User already exists.");
            }
            await UserRepository.createUserWithProfileAndNotifications(userId);
        } catch (error) {
            console.error(`Error creating user ${userId}:`, error instanceof Error ? error.message : error);
            throw new Error("Failed to create user.");
        }
    },

    getUser: async (userId: string) => {
        try {
            const user = await UserRepository.getUser(userId);
            if (!user) {
                throw new Error(`Unable to retrieve user with id ${userId}`);
            }
            return user;
        } catch (error) {
            console.error(`Error retrieving user ${userId}:`, error instanceof Error ? error.message : error);
            throw new Error("Failed to retrieve user.");
        }
    },

    deleteUser: async (userId: string) => {
        try {
            await UserRepository.deleteUser(userId);
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error instanceof Error ? error.message : error);
            throw new Error("Failed to delete user.");
        }
    },

    updateUserUsername: async (userId: string, newName: string) => {
        try {
            await UserRepository.updateUsername(userId, newName);
        } catch (error) {
            console.error(`Error updating username for user ${userId}:`, error instanceof Error ? error.message : error);
            throw new Error("Failed to update username.");
        }
    },

    userExists: async (userId: string) => {
        try {
            const user = await UserRepository.getUser(userId);
            return !!user;
        } catch (error) {
            console.error(`Error checking existence of user ${userId}:`, error instanceof Error ? error.message : error);
            throw new Error("Failed to check user existence.");
        }
    },

    userHasProfile: async (userId: string) => {
        try {
            const user = await UserRepository.getUser(userId);
            return !!user?.profile;
        } catch (error) {
            console.error(`Error checking user profile for ${userId}:`, error instanceof Error ? error.message : error);
            throw new Error("Failed to check if user has a profile.");
        }
    },

    addProfile: async (userId: string, profileId: number) => {
        try {
            await UserRepository.updateProfile(userId, profileId);
        } catch (error) {
            console.error(`Error adding profile ${profileId} to user ${userId}:`, error instanceof Error ? error.message : error);
            throw new Error("Failed to add profile to user.");
        }
    }
};

export default UserService;
