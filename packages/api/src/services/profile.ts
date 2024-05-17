import type { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../errors";
import { AwsRepository } from "../repositories/aws";
import { FollowRepository } from "../repositories/follow";
import { FriendRepository } from "../repositories/friend";
import { PostRepository } from "../repositories/post";
import { ProfileRepository } from "../repositories/profile";
import { UserRepository } from "../repositories/user";
import { UserService } from "./user";

type UpdateProfile = z.infer<typeof sharedValidators.user.updateProfile>;

export class ProfileService {
  private userService = new UserService();
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private awsRepository = new AwsRepository();
  private postRepository = new PostRepository();
  private followersRepository = new FollowRepository();
  private friendsRepository = new FriendRepository();

  async _getUserProfile(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.userRepository.getProfile(user.profileId);

    if (!profile) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    return profile;
  }

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

    const usernameExists =
      await this.profileRepository.usernameExists(newUsername);

    if (usernameExists) {
      throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS);
    }

    await this.profileRepository.updateUsername(profile.id, newUsername);
  }

  async updateProfile(userId: string, updates: UpdateProfile): Promise<void> {
    const profile = await this._getUserProfile(userId);

    // Build an update object dynamically based on what's provided
    if (updates.name !== undefined) {
      await this.profileRepository.updateFullName(profile.id, updates.name);
    }
    if (updates.bio !== undefined) {
      await this.profileRepository.updateBio(profile.id, updates.bio);
    }
    if (updates.username !== undefined) {
      await this.profileRepository.updateUsername(profile.id, updates.username);
    }
  }

  async updateProfilePicture(userId: string, key: string) {
    const profile = await this._getUserProfile(userId);
    await this.profileRepository.updateProfilePicture(profile.id, key);
  }

  async getBasicProfile(userId: string) {
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

  async getOtherUserBasicProfileICantComeUpWithNames(profileId: number) {
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

  async getFullOtherPersonCantNameForTheLifeOfMeProfile(profileId: number) {
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

  async getFullProfile(userId: string) {
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

  async paginateUserPosts(
    userId: string,
    cursor: { createdAt: Date; postId: number },
    pageSize: number,
  ) {
    const posts = await this.postRepository.getPaginatedPosts(
      userId,
      cursor,
      pageSize,
    );
    return posts;
  }

  async removeProfilePicture(userId: string) {
    const profile = await this._getUserProfile(userId);

    const bucket = process.env.S3_POST_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;
    const deleteObject = await this.awsRepository.deleteObject(bucket, key);

    if (!deleteObject.DeleteMarker) {
      throw new DomainError(ErrorCode.FAILED_TO_DELETE);
    }

    await this.profileRepository.removeProfilePicture(profile.id);
  }
}
