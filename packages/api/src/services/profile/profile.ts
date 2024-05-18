import type { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { AwsRepository } from "../../repositories/aws";
import { FollowRepository } from "../../repositories/follow";
import { FriendRepository } from "../../repositories/friend";
import { ProfileRepository } from "../../repositories/profile";
import { UserRepository } from "../../repositories/user";

type UpdateProfile = z.infer<typeof sharedValidators.user.updateProfile>;

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private awsRepository = new AwsRepository();
  private followersRepository = new FollowRepository();
  private friendsRepository = new FriendRepository();

  async updateFullName(userId: string, fullName: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }
    return await this.profileRepository.updateFullName(
      user.profile.id,
      fullName,
    );
  }

  async updateDateOfBirth(userId: string, dateOfBirth: Date) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }
    await this.profileRepository.updateDateOfBirth(
      user.profile.id,
      dateOfBirth,
    );
  }

  async updateBio(userId: string, bio: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }
    await this.profileRepository.updateBio(user.profile.id, bio);
  }

  async updateUsername(userId: string, newUsername: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const usernameExists =
      await this.profileRepository.usernameExists(newUsername);

    if (usernameExists) {
      throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS);
    }

    await this.profileRepository.updateUsername(user.profile.id, newUsername);
  }

  async updateProfile(userId: string, updates: UpdateProfile): Promise<void> {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND, 'Profile not found for the provided user ID.');
    }
  
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
        throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS, 'The provided username already exists.');
      }
      updateData.username = updates.username;
    }
  
    await this.profileRepository.updateProfile(user.profile.id, updateData);
  }
  

  async updateProfilePicture(userId: string, key: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (!user) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }
    await this.profileRepository.updateProfilePicture(user.profile.id, key);
  }

  async getBasicProfileByUserId(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const profilePictureUrl = this.awsRepository.getObjectPresignedUrl({
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
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const profilePictureUrl = this.awsRepository.getObjectPresignedUrl({
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
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      console.log("SERVICE ERROR: profile not found");
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const followerCount = await this.followersRepository.countFollowers(userId);
    if (followerCount === undefined) {
      console.log("SERVICE ERROR: failed to count followers");
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FOLLOWERS);
    }

    const followingCount =
      await this.followersRepository.countFollowing(userId);
    if (followingCount === undefined) {
      console.log("SERVICE ERROR: failed to count following");
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FOLLOWING);
    }

    const friendCount = await this.friendsRepository.countFriends(userId);
    if (friendCount === undefined) {
      console.log("SERVICE ERROR: failed to count friends");
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FRIENDS);
    }

    const profilePictureUrl = await this.awsRepository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.log("SERVICE ERROR: failed to get profile picture");
      throw new DomainError(ErrorCode.FAILED_TO_GET_PROFILE_PICTURE);
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
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }
    const userId = user.id;

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      console.log("SERVICE ERROR: profile not found");
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const followerCount = await this.followersRepository.countFollowers(userId);
    if (followerCount === undefined) {
      console.log("SERVICE ERROR: failed to count followers");
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FOLLOWERS);
    }

    const followingCount =
      await this.followersRepository.countFollowing(userId);
    if (followingCount === undefined) {
      console.log("SERVICE ERROR: failed to count following");
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FOLLOWING);
    }

    const friendCount = await this.friendsRepository.countFriends(userId);
    if (friendCount === undefined) {
      console.log("SERVICE ERROR: failed to count friends");
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FRIENDS);
    }

    const profilePictureUrl = await this.awsRepository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.log("SERVICE ERROR: failed to get profile picture");
      throw new DomainError(ErrorCode.FAILED_TO_GET_PROFILE_PICTURE);
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
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const bucket = process.env.S3_POST_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;
    const deleteObject = await this.awsRepository.deleteObject(bucket, key);

    if (!deleteObject.DeleteMarker) {
      throw new DomainError(ErrorCode.FAILED_TO_DELETE);
    }

    await this.profileRepository.removeProfilePicture(user.profile.id);
  }
}
