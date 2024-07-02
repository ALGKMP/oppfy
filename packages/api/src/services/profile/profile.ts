import { z } from "zod";

import { env } from "@oppfy/env/server";
import { PrivacyStatus, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import {
  FollowRepository,
  FriendRepository,
  ProfileRepository,
  S3Repository,
  UserRepository,
} from "../../repositories";
import { BlockService } from "../network/block";
import { FollowService } from "../network/follow";
import { FriendService } from "../network/friend";

type UpdateProfile = z.infer<typeof trpcValidators.input.profile.updateProfile>;

type PublicFollowState = "NotFollowing" | "Following";
type PrivateFollowState = "NotFollowing" | "Requested" | "Following";
type FriendState = "NotFriends" | "Requested" | "Friends";

interface PublicProfileStatus {
  privacy: "public";
  followState: PublicFollowState;
  friendState: FriendState;
}

interface PrivateProfileStatus {
  privacy: "private";
  followState: PrivateFollowState;
  friendState: FriendState;
}

type ProfileStatus = PublicProfileStatus | PrivateProfileStatus;

interface _ProfileData {
  name: string;
  username: string;
  bio: string | null;
  userId: string;
  profilePictureUrl: string;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  profileStatus: ProfileStatus;
  blocked: boolean;
}

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private s3Repository = new S3Repository();
  private followRepository = new FollowRepository();
  private friendsRepository = new FriendRepository();

  private friendService = new FriendService();
  private followService = new FollowService();
  private blockService = new BlockService();

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
    if (profile.username === newUsername) {
      return;
    }
    const usernameExists =
      await this.profileRepository.usernameExists(newUsername);
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
      const usernameExists = await this.profileRepository.usernameExists(
        updates.username,
      );
      if (usernameExists) {
        console.error(
          `SERVICE ERROR: username "${updates.username}" already exists`,
        );
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
    const user = await this.profileRepository.getProfileByUserId(userId);
    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }
    await this.profileRepository.updateProfilePicture(user.profile.id, key);
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

    const followerCount = await this.followRepository.countFollowers(userId);
    if (followerCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count followers for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWERS,
        "Failed to count followers for the user.",
      );
    }

    const followingCount = await this.followRepository.countFollowing(userId);
    if (followingCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count following for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWING,
        "Failed to count following for the user.",
      );
    }

    const friendCount = await this.friendsRepository.countFriends(userId);
    if (friendCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count friends for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FRIENDS,
        "Failed to count friends for the user.",
      );
    }

    const profilePictureUrl = await this.s3Repository.getObjectPresignedUrl({
      Bucket: env.S3_PROFILE_BUCKET,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.error(
        `SERVICE ERROR: Failed to get profile picture for user ID "${userId}"`,
      );
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

    return trpcValidators.output.profile.fullProfileSelf.parse(profileData);
  }

  async getFullProfileByProfileId(
    currentUserId: string,
    profileId: number,
  ): Promise<z.infer<typeof trpcValidators.output.profile.fullProfileOther>> {
    const otherUser = await this.userRepository.getUserByProfileId(profileId);
    if (!otherUser) {
      console.error(
        `SERVICE ERROR: User not found for profile ID "${profileId}"`,
      );
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided profile ID.",
      );
    }

    const profile = await this.profileRepository.getProfileByProfileId(
      otherUser.profileId,
    );
    if (!profile) {
      console.error(
        `SERVICE ERROR: Profile not found for profile ID "${profileId}"`,
      );
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided profile ID.",
      );
    }

    const username = profile.username;
    const fullName = profile.fullName;

    if (!username || !fullName) {
      console.error(
        `SERVICE ERROR: Profile username and/or fullname not found for profile ID "${profileId}". Username: ${username}, Fullname: ${fullName}`,
      );
      throw new DomainError(
        ErrorCode.PROFILE_INCOMPLETE,
        "Profile username and/or fullname not found.",
      );
    }

    const followerCount = await this.followRepository.countFollowers(
      otherUser.id,
    );
    if (followerCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count followers for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWERS,
        "Failed to count followers for the user.",
      );
    }

    const followingCount = await this.followRepository.countFollowing(
      otherUser.id,
    );
    if (followingCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count following for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWING,
        "Failed to count following for the user.",
      );
    }

    const friendCount = await this.friendsRepository.countFriends(otherUser.id);
    if (friendCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count friends for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FRIENDS,
        "Failed to count friends for the user.",
      );
    }

    const profilePictureUrl = await this.s3Repository.getObjectPresignedUrl({
      Bucket: env.S3_PROFILE_BUCKET,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.error(
        `SERVICE ERROR: Failed to get profile picture for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }

    const networkStatus = await this.getNetworkConnectionStatesBetweenUsers(
      currentUserId,
      otherUser.id,
    );

    const profileData: z.infer<
      typeof trpcValidators.output.profile.fullProfileOther
    > = {
      userId: otherUser.id,
      username: username,
      name: fullName,
      bio: profile.bio,
      followerCount,
      followingCount,
      friendCount,
      profilePictureUrl,
      networkStatus: networkStatus,
    };

    return trpcValidators.output.profile.fullProfileOther.parse(profileData);
  }

  async getBatchProfiles(userIds: string[]) {
    // Warn: if you get zod errors, it's because this functions return doesn't match the compactProfile schema
    const batchProfiles =  await this.profileRepository.getBatchProfiles(userIds);

    return z.array(trpcValidators.output.profile.compactProfile).parse(
      batchProfiles,
    ); 
  }

  async removeProfilePicture(userId: string) {
    const user = await this.profileRepository.getProfileByUserId(userId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }

    const key = `profile-pictures/${userId}.jpg`;
    const deleteObject = await this.s3Repository.deleteObject(
      env.S3_POST_BUCKET,
      key,
    );

    if (!deleteObject.DeleteMarker) {
      console.error(
        `SERVICE ERROR: Failed to delete profile picture for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_DELETE,
        "Failed to delete the profile picture.",
      );
    }

    await this.profileRepository.removeProfilePicture(user.profile.id);
  }

  async _getUserProfile(userId: string) {
    const user = await this.profileRepository.getProfileByUserId(userId);
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


  async getNetworkConnectionStatesBetweenUsers(
    targetUserId: string,
    otherUserId: string,
  ): Promise<z.infer<typeof PrivacyStatus>> {
    const targetUser = await this.userRepository.getUser(targetUserId);
    if (!targetUser) {
      console.error(
        `SERVICE ERROR: User not found for target user ID "${targetUserId}" in getNetworkConnectionStates`,
      );
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    const otherUser = await this.userRepository.getUser(otherUserId);
    if (!otherUser) {
      console.error(
        `SERVICE ERROR: User not found for other user ID "${otherUserId}" in getNetworkConnectionStates`,
      );
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const blocked = await this.blockService.areEitherUsersBlocked(
      targetUserId,
      otherUserId,
    );

    const targetUserFollowState = await this.followService.determineFollowState(
      targetUserId,
      otherUserId,
      otherUser.privacySetting,
    );
    const otherUserFollowState = await this.followService.determineFollowState(
      otherUserId,
      targetUserId,
      otherUser.privacySetting,
    );
    const targetUserFriendState = await this.friendService.determineFriendState(
      targetUserId,
      otherUserId,
    );
    const otherUserFriendState = await this.friendService.determineFriendState(
      otherUserId,
      targetUserId,
    );

    const profileStatus = {
      privacy: otherUser.privacySetting,
      blocked,
      targetUserFollowState,
      otherUserFollowState,
      targetUserFriendState,
      otherUserFriendState,
    };

    return PrivacyStatus.parse(profileStatus);
  }
}
