import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  FriendRepository,
} from "../../repositories";
import { CloudFrontService } from "../aws/cloudfront";
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
  private cloudFrontService = new CloudFrontService();

  private userService = new UserService();

  async paginateFollowersSelf(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const data = await this.followRepository.paginateFollowersSelf(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }

  async paginateFollowersOthers(
    userId: string,
    currentUserId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const canAccess = await this.userService.canAccessUserData({
      currentUserId,
      targetUserId: userId,
    });
    if (!canAccess) {
      return {
        items: [],
        nextCursor: undefined,
      };
    }

    const data = await this.followRepository.paginateFollowersOthers(
      userId,
      currentUserId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }

  async paginateFollowingSelf(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const data = await this.followRepository.paginateFollowingSelf(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }

  async paginateFollowingOthers(
    userId: string,
    currentUserId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const canAccess = await this.userService.canAccessUserData({
      currentUserId,
      targetUserId: userId,
    });
    if (!canAccess) {
      return {
        items: [],
        nextCursor: undefined,
      };
    }

    const data = await this.followRepository.paginateFollowingOthers(
      userId,
      currentUserId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }

  async paginateFriendsSelf(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const data = await this.friendRepository.paginateFriendsSelf(
      userId,
      cursor,
      pageSize,
    );

    return this._processPaginatedData(data, pageSize);
  }

  async paginateFriendsOthers(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
    currentUserId: string,
  ) {
    const canAccess = await this.userService.canAccessUserData({
      currentUserId,
      targetUserId: userId,
    });
    if (!canAccess) {
      return {
        items: [],
        nextCursor: undefined,
      };
    }
    const data = await this.friendRepository.paginateFriendsOther(
      userId,
      currentUserId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }
  async paginateBlocked(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const data = await this.blockRepository.getPaginatedBlockedUsers(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }

  async paginateFriendRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const data = await this.friendRepository.paginateFriendRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }

  async paginateFollowRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ) {
    const data = await this.followRepository.paginateFollowRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._processPaginatedData(data, pageSize);
  }

  private _processPaginatedData<
    T extends {
      profilePictureUrl: string | null;
      profileId: string;
      createdAt: Date;
    },
  >(data: T[], pageSize: number) {
    try {
      if (data.length === 0) {
        return {
          items: [],
          nextCursor: undefined,
        };
      }
      const items = data.map((item) => {
        if (item.profilePictureUrl) {
          const profilePicturePresignedUrl =
            this.cloudFrontService.getSignedUrlForProfilePicture(
              item.profilePictureUrl,
            );
          item.profilePictureUrl = profilePicturePresignedUrl;
        }
        return item;
      });

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
