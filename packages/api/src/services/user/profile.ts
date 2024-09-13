import { z } from "zod";

import { env } from "@oppfy/env";
import {
  sharedValidators,
} from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  ProfileRepository,
  S3Repository,
  SearchRepository,
  UserRepository,
} from "../../repositories";
import { CloudFrontService } from "../aws/cloudfront";
import { BlockService } from "../network/block";
import { FollowService } from "../network/follow";
import { FriendService } from "../network/friend";

const updateProfile = z.object({
  fullName: sharedValidators.user.fullName.optional(),
  username: sharedValidators.user.username.optional(),
  bio: sharedValidators.user.bio.optional(),
  dateOfBirth: sharedValidators.user.dateOfBirth.optional(),
});

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private searchRepository = new SearchRepository();
  private s3Repository = new S3Repository();
  private blockRepository = new BlockRepository();

  private friendService = new FriendService();
  private followService = new FollowService();
  private blockService = new BlockService();
  private cloudFrontService = new CloudFrontService();

  async updateProfile(
    userId: string,
    newData: z.infer<typeof updateProfile>,
  ): Promise<void> {
    const userWithProfile = await this.profileRepository.getUserProfile(userId);

    if (userWithProfile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const { profile } = userWithProfile;

    if (
      newData.username !== undefined &&
      newData.username !== profile.username
    ) {
      const usernameExists = await this.profileRepository.usernameExists(
        newData.username,
      );

      if (usernameExists) {
        throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS);
      }
    }

    await this.profileRepository.updateProfile(profile.id, newData);
    await this.searchRepository.upsertProfile(userWithProfile.id, {
      fullName: newData.fullName,
      username: newData.username,
      bio: newData.bio,
    });
  }

  async getFullProfileSelf(userId: string) {
    const user = await this.profileRepository.getUserFullProfile(userId);

    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
        `SERVICE ERROR: Profile not found for user ID "${userId}" in getFullProfileSelf`,
      );
    }

    const profilePictureUrl = user.profile.profilePictureKey
      ? this.cloudFrontService.getSignedUrlForProfilePicture(
          user.profile.profilePictureKey,
        )
      : null;

    return {
      userId: user.id,
      profileId: user.profile.id,
      privacy: user.privacySetting,
      username: user.profile.username,
      name: user.profile.fullName,
      bio: user.profile.bio,
      followerCount: user.profile.profileStats.followers,
      followingCount: user.profile.profileStats.following,
      friendCount: user.profile.profileStats.friends,
      profilePictureUrl,
      profileStats: user.profile.profileStats,
    };
  }

  async getFullProfileOther({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }) {
    const user = await this.profileRepository.getUserFullProfile(otherUserId);
    if (!user) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
        `SERVICE ERROR: Profile not found for user ID "${otherUserId}"`,
      );
    }

    const profilePictureUrl = user.profile.profilePictureKey
      ? this.cloudFrontService.getSignedUrlForProfilePicture(
          user.profile.profilePictureKey,
        )
      : null;

    const networkStatus = await this.getNetworkConnectionStatesBetweenUsers({
      currentUserId,
      otherUserId,
    });

    return {
      userId: user.id,
      profileId: user.profile.id,
      privacy: user.privacySetting,
      username: user.profile.username,
      name: user.profile.fullName,
      bio: user.profile.bio,
      followerCount: user.profile.profileStats.followers,
      followingCount: user.profile.profileStats.following,
      friendCount: user.profile.profileStats.friends,
      profilePictureUrl,
      networkStatus,
    };
  }

  async getBatchProfiles(userIds: string[]) {
    return await this.profileRepository.getBatchProfiles(userIds);
  }

  async removeProfilePicture(userId: string) {
    const user = await this.profileRepository.getUserProfile(userId);
    if (!user) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }

    const key = `profile-pictures/${userId}.jpg`;
    await this.s3Repository.deleteObject(env.S3_POST_BUCKET, key);

    await this.profileRepository.removeProfilePicture(user.profile.id);
  }

  async getNetworkConnectionStatesBetweenUsers({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }) {
    const targetUser = await this.userRepository.getUser(currentUserId);
    if (!targetUser) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found",
        `SERVICE ERROR: User not found for target user ID "${currentUserId}" in getNetworkConnectionStates`,
      );
    }
    const otherUser = await this.userRepository.getUser(otherUserId);
    if (!otherUser) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found",
        `SERVICE ERROR: User not found for other user ID "${otherUserId}" in getNetworkConnectionStates`,
      );
    }

    const blocked = await this.blockService.areEitherUsersBlocked(
      currentUserId,
      otherUserId,
    );

    const targetUserFollowState = await this.followService.determineFollowState(
      currentUserId,
      otherUserId,
      otherUser.privacySetting,
    );
    const otherUserFollowState = await this.followService.determineFollowState(
      otherUserId,
      currentUserId,
      otherUser.privacySetting,
    );
    const targetUserFriendState = await this.friendService.determineFriendState(
      currentUserId,
      otherUserId,
    );
    const otherUserFriendState = await this.friendService.determineFriendState(
      otherUserId,
      currentUserId,
    );
    const isTargetUserBlocked = (await this.blockRepository.getBlockedUser(
      currentUserId,
      otherUserId,
    ))
      ? true
      : false;
    const isOtherUserBlocked = (await this.blockRepository.getBlockedUser(
      otherUserId,
      currentUserId,
    ))
      ? true
      : false;

    return {
      privacy: otherUser.privacySetting,
      blocked,
      targetUserFollowState,
      otherUserFollowState,
      targetUserFriendState,
      otherUserFriendState,
      isTargetUserBlocked,
      isOtherUserBlocked,
    };
  }
}
