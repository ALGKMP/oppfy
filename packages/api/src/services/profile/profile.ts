import { z } from "zod";

import { env } from "@oppfy/env";
import { PrivacyStatus, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode, handleServiceError } from "../../errors";
import {
  FollowRepository,
  FriendRepository,
  ProfileRepository,
  S3Repository,
  SearchRepository,
  UserRepository,
  ViewRepository,
} from "../../repositories";
import { CloudFrontService } from "../aws/cloudfront";
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

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private searchRepository = new SearchRepository();
  private s3Repository = new S3Repository();
  private followRepository = new FollowRepository();
  private friendsRepository = new FriendRepository();
  private viewRepository = new ViewRepository();

  private friendService = new FriendService();
  private followService = new FollowService();
  private blockService = new BlockService();
  private cloudFrontService = new CloudFrontService();

  @handleServiceError
  async updateProfile(userId: string, newData: UpdateProfile): Promise<void> {
    const user = await this.profileRepository.getUserProfile(userId);

    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }
    const profile = user.profile;

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
    await this.searchRepository.upsertProfile(profile.id, {
      fullName: newData.fullName,
      username: newData.username,
      bio: newData.bio,
    });
  }

  // ! if something like this ever gets used dont forget to sync with opensearch
  // async updateProfilePicture(userId: string, key: string) {
  //   const profile = await this._getUserProfile(userId);
  //   await this.profileRepository.updateProfilePicture(profile.id, key);
  // }

  @handleServiceError
  async getFullProfileSelf(userId: string) {
    const user = await this.profileRepository.getUserFullProfile(userId);

    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    const profilePictureUrl =
      this.cloudFrontService.getSignedUrlForProfilePicture(
        user.profile.profilePictureKey,
      );

    if (!profilePictureUrl) {
      console.error(
        `SERVICE ERROR: Failed to get profile picture for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }

    return trpcValidators.output.profile.fullProfileSelf.parse({
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
    });
  }

  @handleServiceError
  async getFullProfileOther({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }): Promise<z.infer<typeof trpcValidators.output.profile.fullProfileOther>> {
    const user = await this.profileRepository.getUserFullProfile(otherUserId);
    if (!user) {
      console.error(
        `SERVICE ERROR: Profile not found for user ID "${otherUserId}"`,
      );
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    const profilePictureUrl =
      this.cloudFrontService.getSignedUrlForProfilePicture(
        user.profile.profilePictureKey,
      );

    if (!profilePictureUrl) {
      console.error(
        `SERVICE ERROR: Failed to get profile picture for user ID "${user.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }

    const networkStatus = await this.getNetworkConnectionStatesBetweenUsers({
      currentUserId,
      otherUserId,
    });

    const profileData = {
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

    return trpcValidators.output.profile.fullProfileOther.parse(profileData);
  }

  @handleServiceError
  async getBatchProfiles(userIds: string[]) {
    const batchProfiles =
      await this.profileRepository.getBatchProfiles(userIds);

    return z
      .array(trpcValidators.output.profile.compactProfile)
      .parse(batchProfiles);
  }

  @handleServiceError
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

  @handleServiceError
  async getNetworkConnectionStatesBetweenUsers({
    currentUserId,
    otherUserId,
  }: {
    currentUserId: string;
    otherUserId: string;
  }): Promise<z.infer<typeof PrivacyStatus>> {
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

  @handleServiceError
  async viewMultipleProfiles({
    viewerUserId,
    viewedProfileIds,
  }: {
    viewerUserId: string;
    viewedProfileIds: number[];
  }): Promise<void> {
    try {
      await this.viewRepository.viewMultipleProfiles({
        viewerUserId,
        viewedProfileIds,
      });
    } catch (err) {
      throw new DomainError(
        ErrorCode.FAILED_TO_CREATE_VIEW,
        "Failed to create profile views for the user.",
        `SERVICE ERROR: Failed to create profile views for user ID "${viewerUserId}" viewing profiles "${viewedProfileIds}"`,
      );
    }
  }
}
