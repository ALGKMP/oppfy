import { cloudfront } from "@oppfy/cloudfront";

import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  FriendRepository,
} from "../../repositories";
import { UserService } from "../user/user";

// TODO: Move these types into a types file and put the paginated functions into their services.

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Cursor | undefined;
}

interface Cursor {
  createdAt: Date;
  profileId: string;
}

export class PaginationService {
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private blockRepository = new BlockRepository();

  async paginateFollowersSelf({
    userId,
    cursor,
    pageSize = 10,
  }: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }) {
    const data = await this.followRepository.paginateFollowersSelf({
      forUserId: userId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }

  async paginateFollowersOthers({
    userId,
    currentUserId,
    cursor,
    pageSize = 10,
  }: {
    userId: string;
    currentUserId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }) {
    const data = await this.followRepository.paginateFollowersOthers({
      forUserId: userId,
      currentUserId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }

  async paginateFollowingSelf({
    userId,
    cursor,
    pageSize = 10,
  }: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }) {
    const data = await this.followRepository.paginateFollowingSelf({
      userId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }

  async paginateFollowingOthers({
    userId,
    currentUserId,
    cursor,
    pageSize = 10,
  }: {
    userId: string;
    currentUserId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }) {
    const data = await this.followRepository.paginateFollowingOthers({
      forUserId: userId,
      currentUserId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }

  async paginateFriendsSelf({
    userId,
    cursor,
    pageSize = 10,
  }: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }) {
    const data = await this.friendRepository.paginateFriendsSelf({
      forUserId: userId,
      cursor,
      pageSize,
    });

    return await this._processPaginatedData(data, pageSize);
  }

  async paginateFriendsOthers({
    userId,
    cursor,
    pageSize = 10,
    currentUserId,
  }: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
    currentUserId: string;
  }) {
    const data = await this.friendRepository.paginateFriendsOther({
      forUserId: userId,
      currentUserId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }
  async paginateBlocked({
    userId,
    cursor,
    pageSize,
  }: {
    userId: string;
    cursor: Cursor | null;
    pageSize: number;
  }) {
    const data = await this.blockRepository.getPaginatedBlockedUsers({
      forUserId: userId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }

  async paginateFriendRequests({
    userId,
    cursor,
    pageSize = 10,
  }: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }) {
    const data = await this.friendRepository.paginateFriendRequests({
      forUserId: userId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }

  async paginateFollowRequests({
    userId,
    cursor,
    pageSize = 10,
  }: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }) {
    const data = await this.followRepository.paginateFollowRequests({
      forUserId: userId,
      cursor,
      pageSize,
    });
    return await this._processPaginatedData(data, pageSize);
  }

  private async _processPaginatedData<
    T extends {
      profilePictureUrl: string | null;
      profileId: string;
      createdAt: Date;
    },
  >(data: T[], pageSize: number | null) {
    if (pageSize === null) {
      pageSize = 10;
    }

    try {
      if (data.length === 0) {
        return { items: [], nextCursor: undefined };
      }
      const items = await Promise.all(
        data.map(async (item) => {
          if (item.profilePictureUrl) {
            const profilePicturePresignedUrl =
              await cloudfront.getSignedProfilePictureUrl(
                item.profilePictureUrl,
              );
            item.profilePictureUrl = profilePicturePresignedUrl;
          }
          return item;
        }),
      );

      let nextCursor: Cursor | undefined = undefined;
      if (items.length > pageSize) {
        const nextItem = items[pageSize];
        if (!nextItem) {
          // Can just return itemds without nextCursor
          throw new DomainError(
            ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
            "Failed to get profile picture URLs while processing paginated data",
          );
        }

        nextCursor = {
          createdAt: nextItem.createdAt,
          profileId: nextItem.profileId,
        };
      }
      return { items, nextCursor };
    } catch (err) {
      console.error(`Error updating profile picture URLs: `, err);
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URLs",
      );
    }
  }
}
