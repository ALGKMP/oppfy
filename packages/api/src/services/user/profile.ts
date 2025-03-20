import { z } from "zod";

import { cloudfront } from "@oppfy/cloudfront";
import { s3 } from "@oppfy/s3";
import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import {
  ProfileRepository,
  UserRepository,
} from "../../repositories";
import { UserRelationshipRepository } from "../../repositories/network/userRelationship";

const _updateProfile = z.object({
  name: sharedValidators.user.name.optional(),
  username: sharedValidators.user.username.optional(),
  bio: sharedValidators.user.bio.optional(),
  dateOfBirth: sharedValidators.user.dateOfBirth.optional(),
});

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private userRelationshipRepository = new UserRelationshipRepository();

  async getUploadProfilePictureUrl({
    userId,
    contentLength,
  }: {
    userId: string;
    contentLength: number;
  }) {
    const url = await s3.uploadProfilePicture({ userId, contentLength });

    await cloudfront.invalidateProfilePicture(userId);
    return url;
  }

  async updateProfile({
    userId,
    newData,
  }: {
    userId: string;
    newData: z.infer<typeof _updateProfile>;
  }): Promise<void> {
    const userWithProfile = await this.profileRepository.getUserProfile({
      userId,
    });

    if (userWithProfile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const { profile } = userWithProfile;

    if (
      newData.username !== undefined &&
      newData.username !== profile.username
    ) {
      const usernameExists = await this.profileRepository.usernameExists({
        username: newData.username,
      });

      if (usernameExists) {
        throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS);
      }
    }

    await this.profileRepository.updateProfile({
      profileId: profile.id,
      update: newData,
    });
  }

  async getProfileByUsername({ username }: { username: string }) {
    const profile = await this.profileRepository.getProfileByUsername({
      username,
    });
    if (!profile) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    const { profilePictureKey, ...rest } = profile;

    const profilePictureUrl = profilePictureKey
      ? await cloudfront.getSignedProfilePictureUrl(profilePictureKey)
      : null;

    return { ...rest, profilePictureUrl };
  }

  async getProfileSelf({ userId }: { userId: string }) {
    const user = await this.profileRepository.getUserFullProfile({ userId });

    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
        `SERVICE ERROR: Profile not found for user ID "${userId}" in getProfileSelf`,
      );
    }

    const profilePictureUrl = user.profile.profilePictureKey
      ? await cloudfront.getSignedProfilePictureUrl(
          user.profile.profilePictureKey,
        )
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

  async getProfileOther({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }) {
    const user = await this.profileRepository.getUserFullProfile({
      userId: otherUserId,
    });
    if (!user) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
        `SERVICE ERROR: Profile not found for user ID "${otherUserId}"`,
      );
    }

    const profilePictureUrl = user.profile.profilePictureKey
      ? await cloudfront.getSignedProfilePictureUrl(
          user.profile.profilePictureKey,
        )
      : null;

    const relationshipCurrentUserToOtherUser = await this.userRelationshipRepository.getRelationship({
      userIdA: currentUserId,
      userIdB: otherUserId,
    });

    const relationshipOtherUserToCurrentUser = await this.userRelationshipRepository.getRelationship({
      userIdA: otherUserId,
      userIdB: currentUserId,
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
      relationshipCurrentUserToOtherUser,
      relationshipOtherUserToCurrentUser,
      createdAt: user.profile.createdAt,
    };
  }

  // TODO: Move this to the network service
  async getNetworkConnectionStatesBetweenUsers({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }) {
    const targetUser = await this.userRepository.getUser({
      userId: currentUserId,
    });
    if (!targetUser) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found",
        `SERVICE ERROR: User not found for target user ID "${currentUserId}" in getNetworkConnectionStates`,
      );
    }
    const otherUser = await this.userRepository.getUser({
      userId: otherUserId,
    });
    if (!otherUser) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found",
        `SERVICE ERROR: User not found for other user ID "${otherUserId}" in getNetworkConnectionStates`,
      );
    }

    const relationshipCurrentUserToOtherUser = await this.userRelationshipRepository.getRelationship({
      userIdA: currentUserId,
      userIdB: otherUserId,
    });

    const relationshipOtherUserToCurrentUser = await this.userRelationshipRepository.getRelationship({
      userIdA: otherUserId,
      userIdB: currentUserId,
    });

    return {
      relationshipCurrentUserToOtherUser,
      relationshipOtherUserToCurrentUser,
    };
  }

  async searchProfilesByUsername({
    username,
    currentUserId,
  }: {
    username: string;
    currentUserId: string;
  }) {
    const profiles = await this.profileRepository.profilesByUsername({
      username,
      currentUserId,
    });

    const profilesWithUrls = await Promise.all(
      profiles.map(async (profile) => {
        const { profilePictureKey, ...rest } = profile;
        return {
          ...rest,
          profilePictureUrl: profilePictureKey
            ? await cloudfront.getSignedProfilePictureUrl(profilePictureKey)
            : null,
        };
      }),
    );

    return profilesWithUrls;
  }
}