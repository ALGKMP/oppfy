import { z } from "zod";

import { sharedValidators } from "@acme/validators";

import { DomainError, ErrorCode } from "../errors";
import { AwsRepository } from "../repositories/aws";
import { FollowRepository } from "../repositories/follow";
import { FriendRepository } from "../repositories/friend";
import { PostRepository } from "../repositories/post";
import { ProfileRepository } from "../repositories/profile";
import { ProfilePictureRepository } from "../repositories/profilePicture";
import { UserRepository } from "../repositories/user";
import { UserService } from "./user";

type UpdateProfile = z.infer<typeof sharedValidators.user.updateProfile>;

export class ProfileService {
  private userService = new UserService();
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private profilePictureRepository = new ProfilePictureRepository();
  private awsRepository = new AwsRepository();
  private postRepository = new PostRepository();
  private followersRepository = new FollowRepository();
  private friendsRepository = new FriendRepository();

  async updateFullName(userId: string, fullName: string) {
    const profile = await this.getUserProfile(userId);
    return await this.profileRepository.updateFullName(profile.id, fullName);
  }

  async updateDateOfBirth(userId: string, dateOfBirth: Date) {
    const profile = await this.getUserProfile(userId);
    await this.profileRepository.updateDateOfBirth(profile.id, dateOfBirth);
  }

  async updateBio(userId: string, bio: string) {
    const profile = await this.getUserProfile(userId);
    await this.profileRepository.updateBio(profile.id, bio);
  }

  async updateProfile(userId: string, updates: UpdateProfile): Promise<void> {
    const profile = await this.getUserProfile(userId);

    // Build an update object dynamically based on what's provided
    if (updates.name !== undefined) {
      await this.profileRepository.updateFullName(profile.id, updates.name);
    }
    if (updates.bio !== undefined) {
      await this.profileRepository.updateBio(profile.id, updates.bio);
    }
    if (updates.username !== undefined) {
      await this.userService.updateUsername(userId, updates.username);
    }
  }

  async updateProfilePicture(userId: string, key: string) {
    const profile = await this.getUserProfile(userId);

    await this.profilePictureRepository.updateProfilePicture(
      profile.profilePictureId,
      key,
    );
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.userRepository.getProfile(user.profileId);

    if (profile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    return profile;
  }

  async getProfilePicture(userId: string) {
    const bucket = process.env.S3_PROFILE_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;
    const pfp = await this.profilePictureRepository.getProfilePictureByKey(key);
    if (pfp) {
      return await this.awsRepository.getObjectPresignedUrl({
        Bucket: bucket,
        Key: key,
      });
    } else {
      return await this.awsRepository.getObjectPresignedUrl({
        Bucket: bucket,
        Key: "profile-pictures/default.jpg",
      });
    }
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

    const profilePictureUrl = profile.profilePictureId
      ? await this.getProfilePicture(userId)
      : "profile-pictures/default.jpg";

    return sharedValidators.user.basicProfile.parse({
      userId: user.id,
      privacy: user.privacySetting,
      username: user.username,
      name: profile.fullName,
      profilePictureUrl,
    });
  }

  async getFullProfile(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);
    if (!profile) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const followerCount = await this.followersRepository.countFollowers(userId);
    if (followerCount === undefined) {
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FOLLOWERS);
    }

    const followingCount =
      await this.followersRepository.countFollowing(userId);
    if (followingCount === undefined) {
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FOLLOWING);
    }

    const friendCount = await this.friendsRepository.countFriends(userId);

    const profilePictureUrl = profile.profilePictureId
      ? await this.getProfilePicture(userId)
      : "profile-pictures/default.jpg";

    const profileData = {
      userId: user.id,
      privacy: user.privacySetting,
      username: user.username,
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
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.profileRepository.getProfile(user.profileId);

    if (profile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const bucket = process.env.S3_POST_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;
    const deleteObject = await this.awsRepository.deleteObject(bucket, key);

    if (!deleteObject.DeleteMarker) {
      throw new DomainError(ErrorCode.FAILED_TO_DELETE);
    }

    await this.profilePictureRepository.removeProfilePicture(
      profile.profilePictureId,
    );
  }
}
