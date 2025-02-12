import { z } from "zod";

import { cloudfront } from "@oppfy/cloudfront";
import { env } from "@oppfy/env";
import { openSearch, OpenSearchIndex } from "@oppfy/opensearch";
import type { OpenSearchProfileIndexResult } from "@oppfy/opensearch";
import { s3 } from "@oppfy/s3";
import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  ProfileRepository,
  UserRepository,
} from "../../repositories";
import { BlockService } from "../network/block";
import { FollowService } from "../network/follow";
import { FriendService } from "../network/friend";

const updateProfile = z.object({
  name: sharedValidators.user.name.optional(),
  username: sharedValidators.user.username.optional(),
  bio: sharedValidators.user.bio.optional(),
  dateOfBirth: sharedValidators.user.dateOfBirth.optional(),
});

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private blockRepository = new BlockRepository();

  private friendService = new FriendService();
  private followService = new FollowService();
  private blockService = new BlockService();

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
    console.log("upserting profile");
    await this._upsertProfileSearch(userWithProfile.id, {
      name: newData.name,
      username: newData.username,
      bio: newData.bio,
    });
  }

  async getProfileByUsername(username: string) {
    const profile = await this.profileRepository.getProfileByUsername(username);

    if (profile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const profilePictureUrl = profile.profilePictureKey
      ? await this._getSignedProfilePictureUrl(profile.profilePictureKey)
      : null;

    return {
      ...profile,
      profilePictureUrl,
    };
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
      ? await this._getSignedProfilePictureUrl(user.profile.profilePictureKey)
      : null;

    return {
      userId: user.id,
      profileId: user.profile.id,
      privacy: user.privacySetting,
      username: user.profile.username,
      name: user.profile.name,
      bio: user.profile.bio,
      followerCount: user.profile.profileStats.followers,
      followingCount: user.profile.profileStats.following,
      friendCount: user.profile.profileStats.friends,
      postCount: user.profile.profileStats.posts,
      profilePictureUrl,
      profileStats: user.profile.profileStats,
      createdAt: user.profile.createdAt,
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
      ? await this._getSignedProfilePictureUrl(user.profile.profilePictureKey)
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
      name: user.profile.name,
      bio: user.profile.bio,
      followerCount: user.profile.profileStats.followers,
      followingCount: user.profile.profileStats.following,
      friendCount: user.profile.profileStats.friends,
      postCount: user.profile.profileStats.posts,
      profilePictureUrl,
      networkStatus,
      createdAt: user.profile.createdAt,
    };
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

  async invalidateProfilePicture(userId: string) {
    const distributionId = env.CLOUDFRONT_PROFILE_DISTRIBUTION_ID;
    const objectPattern = `/profile-pictures/${userId}.jpg`;
    await cloudfront.createInvalidation(distributionId, objectPattern);
  }

  private async _getSignedProfilePictureUrl(key: string) {
    const url = cloudfront.getProfilePictureUrl(key);
    return await cloudfront.getSignedUrl({ url });
  }

  private async _upsertProfileSearch(
    userId: string,
    newProfileData: Partial<OpenSearchProfileIndexResult>,
  ) {
    const userWithProfile = await this.profileRepository.getUserProfile(userId);

    if (userWithProfile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }
    const profileData = userWithProfile.profile;

    const documentBody = {
      ...profileData,
      ...newProfileData,
    };

    await openSearch.index({
      index: OpenSearchIndex.PROFILE,
      id: userId,
      body: documentBody,
    });
  }

  async getProfilePictureUploadUrl(userId: string, contentLength: number) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    return await this.profileRepository.uploadProfilePictureUrl({
      userId,
      contentLength,
    });
  }

  async searchProfilesByUsername(username: string, currentUserId: string) {
    const user = await this.userRepository.getUser(currentUserId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profiles = await this.profileRepository.profilesByUsername(
      username,
      user.id,
    );

    const profilesWithUrls = await Promise.all(
      profiles.map(async ({ profilePictureKey, ...restProfile }) => {
        const profilePictureUrl = profilePictureKey
          ? await this.profileRepository.getSignedProfilePictureUrl(
              profilePictureKey,
            )
          : null;

        return {
          ...restProfile,
          profilePictureUrl,
        };
      }),
    );

    return profilesWithUrls;
  }
}
