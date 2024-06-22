import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  FriendRepository,
} from "../../repositories";
import { S3Service } from "../aws/s3";

// TODO: Move these types into a d.types and put the paginated functions into their services.

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
  profileId: number;
  username: string | null;
  privacy?: "public" | "private";
  name: string | null;
  profilePictureUrl: string;
  createdAt: Date;
  isFollowing?: boolean;
}

export class PaginationService {
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private blockRepository = new BlockRepository();

  private awsService = new S3Service();

  async paginateFollowersSelf(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.paginateFollowersSelf(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
  }

  async paginateFollowersOthers(
    userId: string,
    currentUserId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.paginateFollowersOthers(
      userId,
      currentUserId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
  }

  async paginateFollowingSelf(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.paginateFollowingSelf(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
  }

  async paginateFollowingOthers(
    userId: string,
    currentUserId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.paginateFollowingOthers(
      userId,
      currentUserId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
  }

  async paginateFriendsSelf(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.friendRepository.paginateFriendsSelf(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
  }

  async paginateFriendsOthers(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
    currentUserId: string,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.friendRepository.paginateFriendsOther(
      userId,
      currentUserId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
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
    return this._processPaginatedUserData(data, pageSize);
  }

  async paginateFriendRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.friendRepository.paginateFriendRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
  }

  async paginateFollowRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.followRepository.paginateFollowRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedUserData(data, pageSize);
  }

  private async _processPaginatedUserData(
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
}
