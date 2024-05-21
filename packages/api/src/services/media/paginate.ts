import { PrivacyStatus } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository, FriendRepository } from "../../repositories";
import { BlockRepository } from "../../repositories/user/block";
import { UserRepository } from "../../repositories/user/user";
import { S3Service } from "../aws/s3";
import { FollowService } from "../network/follow";
import { FriendService } from "../network/friend";

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Cursor | undefined;
}

interface Cursor {
  createdAt: Date;
  profileId: number;
}

export interface UserProfile {
  userId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string;
  createdAt: Date;
  profileId: number;
}

export class PaginationService {
  private userRepository = new UserRepository();
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private blockRepository = new BlockRepository();

  private awsService = new S3Service();
  private followService = new FollowService();
  private friendService = new FriendService();

  async paginateFollowers(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.paginateCurrentUserFollowers(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFollowing(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.paginateFollowing(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFriends(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.friendRepository.paginateFriends(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateBlocked(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.blockRepository.getPaginatedBlockedUsers(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFriendRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.friendRepository.getPaginatedFriendRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFollowRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.getPaginatedFollowRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  private async _updateProfilePictureUrls(
    data: UserProfile[],
    pageSize: number,
  ): Promise<PaginatedResponse<UserProfile>> {
    try {
      if (data.length === 0) {
        return {
          items: [],
          nextCursor: undefined,
        };
      }
      const items = await Promise.all(
        data.map(async (item) => {
          const presignedUrl = await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: item.profilePictureUrl,
          });
          item.profilePictureUrl = presignedUrl;
          return item;
        }),
      );

      let nextCursor: Cursor | undefined = undefined;
      if (items.length > pageSize) {
        const nextItem = items.pop();
        nextCursor = {
          createdAt: nextItem!.createdAt,
          profileId: nextItem!.profileId,
        };
      }
      return {
        items,
        nextCursor,
      };
    } catch (err) {
      console.error(`Error updating profile picture URLs: `, err);
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URLs",
      );
    }
  }

  async getProfileStatus(currentUserId: string, otherUserId: string) {
    const otherUser = await this.userRepository.getUser(otherUserId);
    if (!otherUser) {
      console.error(`SERVICE ERROR: User not found for ID "${otherUserId}"`);
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    const currentUserFollowState =
      await this.followService.determineFollowState(
        currentUserId,
        otherUserId,
        otherUser.privacySetting,
      );
    const otherUserFollowState = await this.followService.determineFollowState(
      otherUserId,
      currentUserId,
      otherUser.privacySetting,
    );
    const currentUserFriendState =
      await this.friendService.determineFriendState(currentUserId, otherUserId);
    const otherUserFriendState = await this.friendService.determineFriendState(
      otherUserId,
      currentUserId,
    );

    const profileStatus = {
      privacy: otherUser.privacySetting,
      currentUserFollowState,
      otherUserFollowState,
      currentUserFriendState,
      otherUserFriendState,
    };

    return PrivacyStatus.parse(profileStatus);
  }
}
