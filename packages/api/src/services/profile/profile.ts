import type { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { S3Repository } from "../../repositories/s3";
import { FollowRepository } from "../../repositories/follow";
import { FriendRepository } from "../../repositories/friend";
import { ProfileRepository } from "../../repositories/profile";
import { UserRepository } from "../../repositories/user";

type UpdateProfile = z.infer<typeof sharedValidators.user.updateProfile>;

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private s3Repository = new S3Repository();
  private followersRepository = new FollowRepository();
  private friendsRepository = new FriendRepository();

  async updateFullName(userId: string, fullName: string) {
    const profile = await this._getUserProfile(userId);
    return await this.profileRepository.updateFullName(profile.id, fullName);
  }

  async updateDateOfBirth(userId: string, dateOfBirth: Date) {
    const profile = await this._getUserProfile(userId);
    await this.profileRepository.updateDateOfBirth(profile.id, dateOfBirth);
  }

  async updateBio(userId: string, bio: string) {
    const profile = await this._getUserProfile(userId);
    await this.profileRepository.updateBio(profile.id, bio);
  }

  async updateUsername(userId: string, newUsername: string) {
    const profile = await this._getUserProfile(userId);
    const usernameExists = await this.profileRepository.usernameExists(newUsername);
    if (usernameExists) {
      console.error(`SERVICE ERROR: username "${newUsername}" already exists`);
      throw new DomainError(
        ErrorCode.USERNAME_ALREADY_EXISTS,
        "The provided username already exists.",
      );
    }
    await this.profileRepository.updateUsername(profile.id, newUsername);
  }

  async updateProfile(userId: string, updates: UpdateProfile): Promise<void> {
    const profile = await this._getUserProfile(userId);

    const updateData: Partial<UpdateProfile> = {};
    if (updates.fullName !== undefined) {
      updateData.fullName = updates.fullName;
    }
    if (updates.bio !== undefined) {
      updateData.bio = updates.bio;
    }
    if (updates.username !== undefined) {
      const usernameExists = await this.profileRepository.usernameExists(updates.username);
      if (usernameExists) {
        console.error(`SERVICE ERROR: username "${updates.username}" already exists`);
        throw new DomainError(
          ErrorCode.USERNAME_ALREADY_EXISTS,
          "The provided username already exists.",
        );
      }
      updateData.username = updates.username;
    }

    await this.profileRepository.updateProfile(profile.id, updateData);
  }

  async updateProfilePicture(userId: string, key: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }
    await this.profileRepository.updateProfilePicture(user.profile.id, key);
  }

  async getBasicProfileByUserId(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    const profilePictureUrl = this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });

    return sharedValidators.user.basicProfile.parse({
      userId: user.id,
      privacy: user.privacySetting,
      username: profile.username,
      name: profile.fullName,
      profilePictureUrl,
    });
  }

  async getBasicProfileByProfileId(profileId: number) {
    const user = await this.userRepository.getUserByProfileId(profileId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for profile ID "${profileId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided profile ID.",
      );
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      console.error(`SERVICE ERROR: Profile not found for profile ID "${profileId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided profile ID.",
      );
    }

    const profilePictureUrl = this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });

    return sharedValidators.user.basicProfile.parse({
      userId: user.id,
      privacy: user.privacySetting,
      username: profile.username,
      name: profile.fullName,
      profilePictureUrl,
    });
  }

  async getFullProfileByUserId(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }
    const profile = await this._getUserProfile(userId);

    const followerCount = await this.followersRepository.countFollowers(userId);
    if (followerCount === undefined) {
      console.error(`SERVICE ERROR: Failed to count followers for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWERS,
        "Failed to count followers for the user.",
      );
    }

    const followingCount = await this.followersRepository.countFollowing(userId);
    if (followingCount === undefined) {
      console.error(`SERVICE ERROR: Failed to count following for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWING,
        "Failed to count following for the user.",
      );
    }

    const friendCount = await this.friendsRepository.countFriends(userId);
    if (friendCount === undefined) {
      console.error(`SERVICE ERROR: Failed to count friends for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FRIENDS,
        "Failed to count friends for the user.",
      );
    }

    const profilePictureUrl = await this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.error(`SERVICE ERROR: Failed to get profile picture for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }

    const profileData = {
      userId: user.id,
      privacy: user.privacySetting,
      username: profile.username,
      name: profile.fullName,
      bio: profile.bio,
      followerCount,
      followingCount,
      friendCount,
      profilePictureUrl,
    };

    return sharedValidators.user.fullProfile.parse(profileData);
  }

  async getFullProfileByProfileId(profileId: number) {
    const user = await this.userRepository.getUserByProfileId(profileId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for profile ID "${profileId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided profile ID.",
      );
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      console.error(`SERVICE ERROR: Profile not found for profile ID "${profileId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided profile ID.",
      );
    }

    const followerCount = await this.followersRepository.countFollowers(user.id);
    if (followerCount === undefined) {
      console.error(`SERVICE ERROR: Failed to count followers for user ID "${user.id}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWERS,
        "Failed to count followers for the user.",
      );
    }

    const followingCount = await this.followersRepository.countFollowing(user.id);
    if (followingCount === undefined) {
      console.error(`SERVICE ERROR: Failed to count following for user ID "${user.id}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWING,
        "Failed to count following for the user.",
      );
    }

    const friendCount = await this.friendsRepository.countFriends(user.id);
    if (friendCount === undefined) {
      console.error(`SERVICE ERROR: Failed to count friends for user ID "${user.id}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FRIENDS,
        "Failed to count friends for the user.",
      );
    }

    const profilePictureUrl = await this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.error(`SERVICE ERROR: Failed to get profile picture for user ID "${user.id}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }

    const profileData = {
      userId: user.id,
      privacy: user.privacySetting,
      username: profile.username,
      name: profile.fullName,
      bio: profile.bio,
      followerCount,
      followingCount,
      friendCount,
      profilePictureUrl,
    };

    return sharedValidators.user.fullProfile.parse(profileData);
  }

  async removeProfilePicture(userId: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }

    const bucket = process.env.S3_POST_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;
    const deleteObject = await this.s3Repository.deleteObject(bucket, key);

    if (!deleteObject.DeleteMarker) {
      console.error(`SERVICE ERROR: Failed to delete profile picture for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_DELETE,
        "Failed to delete the profile picture.",
      );
    }

    await this.profileRepository.removeProfilePicture(user.profile.id);
  }

  async _getUserProfile(userId: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    if (!user.profile) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    return user.profile;
  }
}
