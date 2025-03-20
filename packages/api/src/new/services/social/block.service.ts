import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { TYPES } from "../../container";
import { BlockErrors } from "../../errors/social/block.error";
import type { IBlockRepository } from "../../interfaces/repositories/social/blockRepository.interface";
import type { IFollowRepository } from "../../interfaces/repositories/social/followRepository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friendRepository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notificationRepository.interface";
import type { IProfileStatsRepository } from "../../interfaces/repositories/user/profileStatsRepository.interface";
import type { IBlockService } from "../../interfaces/services/social/blockService.interface";

@injectable()
export class BlockService implements IBlockService {
  constructor(
    @inject(TYPES.BlockRepository)
    private blockRepository: IBlockRepository,
    @inject(TYPES.FollowRepository)
    private followRepository: IFollowRepository,
    @inject(TYPES.FriendRepository)
    private friendRepository: IFriendRepository,
    @inject(TYPES.NotificationsRepository)
    private notificationsRepository: INotificationsRepository,
    @inject(TYPES.ProfileStatsRepository)
    private profileStatsRepository: IProfileStatsRepository,
  ) {}

  async blockUser(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<
    Result<void, BlockErrors.CannotBlockSelf | BlockErrors.AlreadyBlocked>
  > {
    const { blockerId, blockedId } = options;

    // Cannot block yourself
    if (blockerId === blockedId) {
      return err(new BlockErrors.CannotBlockSelf());
    }

    // Check if already blocked
    const isBlocked = await this.blockRepository.getBlockedUser({
      userId: blockerId,
      blockedUserId: blockedId,
    });
    if (isBlocked) {
      return err(new BlockErrors.AlreadyBlocked());
    }

    // Get all current relationships
    const [
      followingUserBeingBlocked,
      followedByUserBeingBlocked,
      friendship,
      outgoingFriendRequest,
      incomingFriendRequest,
      outgoingFollowRequest,
      incomingFollowRequest,
    ] = await Promise.all([
      this.followRepository.getFollower({
        followerId: blockerId,
        followeeId: blockedId,
      }),
      this.followRepository.getFollower({
        followerId: blockedId,
        followeeId: blockerId,
      }),
      this.friendRepository.getFriendship({
        userIdA: blockerId,
        userIdB: blockedId,
      }),
      this.friendRepository.getFriendRequest({
        senderId: blockerId,
        recipientId: blockedId,
      }),
      this.friendRepository.getFriendRequest({
        senderId: blockedId,
        recipientId: blockerId,
      }),
      this.followRepository.getFollowRequest({
        senderId: blockerId,
        recipientId: blockedId,
      }),
      this.followRepository.getFollowRequest({
        senderId: blockedId,
        recipientId: blockerId,
      }),
    ]);

    // Clean up all relationships
    const cleanupPromises: Promise<unknown>[] = [];

    // Remove following relationships and update stats
    if (followingUserBeingBlocked) {
      cleanupPromises.push(
        this.followRepository.removeFollower({
          followerId: blockerId,
          followeeId: blockedId,
        }),
        this.profileStatsRepository.decrementFollowingCount({
          userId: blockerId,
          amount: 1,
        }),
      );
    }

    if (followedByUserBeingBlocked) {
      cleanupPromises.push(
        this.followRepository.removeFollower({
          followerId: blockedId,
          followeeId: blockerId,
        }),
        this.profileStatsRepository.decrementFollowerCount({
          userId: blockerId,
          amount: 1,
        }),
      );
    }

    // Remove friendship and update stats
    if (friendship) {
      cleanupPromises.push(
        this.friendRepository.removeFriend({
          userIdA: blockerId,
          userIdB: blockedId,
        }),
        this.profileStatsRepository.decrementFriendsCount({
          userId: blockerId,
          amount: 1,
        }),
        this.profileStatsRepository.decrementFriendsCount({
          userId: blockedId,
          amount: 1,
        }),
      );
    }

    // Clean up any pending friend requests
    if (outgoingFriendRequest) {
      cleanupPromises.push(
        this.friendRepository.deleteFriendRequest({
          senderId: blockerId,
          recipientId: blockedId,
        }),
      );
    }

    if (incomingFriendRequest) {
      cleanupPromises.push(
        this.friendRepository.deleteFriendRequest({
          senderId: blockedId,
          recipientId: blockerId,
        }),
      );
    }

    // Clean up any pending follow requests
    if (outgoingFollowRequest) {
      cleanupPromises.push(
        this.followRepository.removeFollowRequest(
          blockerId,
          blockedId,
          undefined,
        ),
      );
    }

    if (incomingFollowRequest) {
      cleanupPromises.push(
        this.followRepository.removeFollowRequest(
          blockedId,
          blockerId,
          undefined,
        ),
      );
    }

    // Clean up notifications between the users
    cleanupPromises.push(
      this.notificationsRepository.deleteNotificationsBetweenUsers({
        userIdA: blockerId,
        userIdB: blockedId,
      }),
    );

    // Execute all cleanup operations and create block
    await Promise.all([
      ...cleanupPromises,
      this.blockRepository.blockUser({
        userId: blockerId,
        blockedUserId: blockedId,
      }),
    ]);

    return ok();
  }

  async unblockUser(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<Result<void, BlockErrors.BlockNotFound>> {
    const { blockerId, blockedId } = options;

    const isBlocked = await this.blockRepository.getBlockedUser({
      userId: blockerId,
      blockedUserId: blockedId,
    });
    if (!isBlocked) {
      return err(new BlockErrors.BlockNotFound());
    }

    await this.blockRepository.unblockUser({
      userId: blockerId,
      blockedUserId: blockedId,
    });
    return ok(undefined);
  }

  async isBlocked(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<Result<boolean, never>> {
    const { blockerId, blockedId } = options;

    const isBlocked = await this.blockRepository.getBlockedUser({
      userId: blockerId,
      blockedUserId: blockedId,
    });
    return ok(!!isBlocked);
  }

  async getBlockedUsers(options: {
    userId: string;
    cursor?: { createdAt: Date; userId: string } | null;
    pageSize?: number;
  }): Promise<
    Result<
      {
        items: {
          userId: string;
          username: string;
          name: string;
          profilePictureUrl: string | null;
          createdAt: Date;
        }[];
        nextCursor: { createdAt: Date; userId: string } | null;
      },
      never
    >
  > {
    const { userId, cursor = null, pageSize = 10 } = options;

    const results = await this.blockRepository.getPaginatedBlockedUsers({
      forUserId: userId,
      cursor: cursor
        ? {
            createdAt: cursor.createdAt,
            profileId: cursor.userId,
          }
        : null,
      pageSize: pageSize + 1,
    });

    const hasNextPage = results.length > pageSize;
    const items = hasNextPage ? results.slice(0, -1) : results;
    const lastItem = items.length > 0 ? items[items.length - 1] : null;
    const nextCursor =
      hasNextPage && lastItem
        ? {
            createdAt: lastItem.createdAt,
            userId: lastItem.profileId,
          }
        : null;

    return ok({
      items: items.map((item) => ({
        userId: item.userId,
        username: item.username,
        name: item.name ?? "",
        profilePictureUrl: item.profilePictureUrl,
        createdAt: item.createdAt,
      })),
      nextCursor,
    });
  }
}
