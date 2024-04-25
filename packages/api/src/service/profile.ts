import Repositories from '../repository';
import UserService from './user';

const ProfileService = {
    createProfileForUser: async (userId: string) => {
        try {
            if (await UserService.userHasProfile(userId)) {
                throw new Error("User already has a profile.");
            }

            const profileId = await Repositories.profile.createProfile();  // Updated repository access
            await UserService.addProfile(userId, profileId);
            return profileId;
        } catch (error) {
            console.error('Error creating profile for user:', userId, error instanceof Error ? error.message : error);
            throw new Error("Failed to create profile for user.");
        }
    },

    getProfileByUserId: async (userId: string) => {
        try {
            const user = await UserService.getUser(userId);
            if (!user?.profile) {
                throw new Error("User does not have an associated profile.");
            }
            return await ProfileService.getProfile(user.profile);
        } catch (error) {
            console.error('Error retrieving profile by user ID:', userId, error instanceof Error ? error.message : error);
            throw new Error("Failed to retrieve profile by user ID.");
        }
    },

    getProfile: async (profileId: number) => {
        try {
            const profile = await Repositories.profile.getProfile(profileId);  // Updated repository access
            if (!profile) {
                throw new Error("Profile does not exist.");
            }
            return profile;
        } catch (error) {
            console.error('Error getting profile:', profileId, error instanceof Error ? error.message : error);
            throw new Error("Failed to retrieve profile.");
        }
    },

    profileExists: async (profileId: number) => {
        try {
            const profile = await Repositories.profile.getProfile(profileId);  // Updated repository access
            return profile !== null;
        } catch (error) {
            console.error('Error checking if profile exists:', profileId, error instanceof Error ? error.message : error);
            throw new Error("Failed to check if profile exists.");
        }
    },

    updateName: async (userId: string, name: string) => {
        try {
            const profile = await ProfileService.getProfileByUserId(userId);
            await Repositories.profile.updateProfileName(profile.id, name);  // Updated repository access
        } catch (error) {
            console.error('Error updating profile name:', userId, error instanceof Error ? error.message : error);
            throw new Error("Failed to update profile name.");
        }
    },

    updateDateOfBirth: async (userId: string, dateOfBirth: Date) => {
        try {
            const profile = await ProfileService.getProfileByUserId(userId);
            await Repositories.profile.updateProfileDateOfBirth(profile.id, dateOfBirth);  // Updated repository access
        } catch (error) {
            console.error('Error updating profile date of birth:', userId, error instanceof Error ? error.message : error);
            throw new Error("Failed to update profile date of birth.");
        }
    },

    profileHasName: async (userId: string) => {
        try {
            const profile = await ProfileService.getProfileByUserId(userId);
            return !!profile.name;
        } catch (error) {
            console.error('Error checking if profile has name:', userId, error instanceof Error ? error.message : error);
            throw new Error("Failed to check if profile has name.");
        }
    },

    profileHasDateOfBirth: async (userId: string) => {
        try {
            const profile = await ProfileService.getProfileByUserId(userId);
            return !!profile.dateOfBirth;
        } catch (error) {
            console.error('Error checking if profile has date of birth:', userId, error instanceof Error ? error.message : error);
            throw new Error("Failed to check if profile has date of birth.");
        }
    }
};

export default ProfileService;
