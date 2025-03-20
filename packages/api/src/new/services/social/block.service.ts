import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { BlockErrors } from "../../errors/social/block.error";
import type { IBlockRepository } from "../../interfaces/repositories/social/blockRepository.interface";
import type { IFollowRepository } from "../../interfaces/repositories/social/followRepository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friendRepository.interface";
import type { IRelationshipRepository } from "../../interfaces/repositories/social/relationshipRepository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notificationRepository.interface";
import type { IProfileStatsRepository } from "../../interfaces/repositories/user/profileStatsRepository.interface";
import type {
  BlockedUser,
  IBlockService,
  PaginatedResponse,
  PaginationCursor,
} from "../../interfaces/services/social/blockService.interface";

@injectable()
export class BlockService implements IBlockService {
  constructor(
    @inject(TYPES.Database)
    private db: Database,
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
    @inject(TYPES.RelationshipRepository)
    private relationshipRepository: IRelationshipRepository,
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

    await this.db.transaction(async (tx) => {
      // Update relationship status
      await this.relationshipRepository.upsert(
        blockerId,
        blockedId,
        {
          friendshipStatus: "notFriends",
          followStatus: "notFollowing",
          blockStatus: true,
        },
        tx,
      );

      // Get current relationships to update stats
      const [following, follower, friendship] = await Promise.all([
        this.followRepository.getFollower(
          {
            followerId: blockerId,
            followeeId: blockedId,
          },
          tx,
        ),
        this.followRepository.getFollower(
          {
            followerId: blockedId,
            followeeId: blockerId,
          },
          tx,
        ),
        this.friendRepository.getFriendship(
          {
            userIdA: blockerId,
            userIdB: blockedId,
          },
          tx,
        ),
      ]);

      // Clean up relationships and update stats
      const cleanupPromises = [
        // Create block
        this.blockRepository.blockUser(
          {
            userId: blockerId,
            blockedUserId: blockedId,
          },
          tx,
        ),

        // Delete follow relationships
        this.followRepository.removeFollower(
          {
            followerId: blockerId,
            followeeId: blockedId,
          },
          tx,
        ),
        this.followRepository.removeFollower(
          {
            followerId: blockedId,
            followeeId: blockerId,
          },
          tx,
        ),

        // Delete follow requests
        this.followRepository.removeFollowRequest(blockerId, blockedId, tx),
        this.followRepository.removeFollowRequest(blockedId, blockerId, tx),

        // Delete friend relationship and requests
        this.friendRepository.removeFriend(
          {
            userIdA: blockerId,
            userIdB: blockedId,
          },
          tx,
        ),
        this.friendRepository.deleteFriendRequest(
          {
            senderId: blockerId,
            recipientId: blockedId,
          },
          tx,
        ),
        this.friendRepository.deleteFriendRequest(
          {
            senderId: blockedId,
            recipientId: blockerId,
          },
          tx,
        ),

        // Delete notifications
        this.notificationsRepository.deleteNotificationsBetweenUsers(
          {
            userIdA: blockerId,
            userIdB: blockedId,
          },
          tx,
        ),
      ];

      // Add stat updates if needed
      if (following) {
        cleanupPromises.push(
          this.profileStatsRepository.decrementFollowingCount(
            {
              userId: blockerId,
              amount: 1,
            },
            tx,
          ),
        );
      }

      if (follower) {
        cleanupPromises.push(
          this.profileStatsRepository.decrementFollowerCount(
            {
              userId: blockerId,
              amount: 1,
            },
            tx,
          ),
        );
      }

      if (friendship) {
        cleanupPromises.push(
          this.profileStatsRepository.decrementFriendsCount(
            {
              userId: blockerId,
              amount: 1,
            },
            tx,
          ),
          this.profileStatsRepository.decrementFriendsCount(
            {
              userId: blockedId,
              amount: 1,
            },
            tx,
          ),
        );
      }

      await Promise.all(cleanupPromises);
    });

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

    await this.db.transaction(async (tx) => {
      await Promise.all([
        this.blockRepository.unblockUser(
          {
            userId: blockerId,
            blockedUserId: blockedId,
          },
          tx,
        ),
        this.relationshipRepository.upsert(
          blockerId,
          blockedId,
          {
            blockStatus: false,
          },
          tx,
        ),
      ]);
    });

    return ok();
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
    cursor?: PaginationCursor | null;
    pageSize?: number;
  }): Promise<Result<PaginatedResponse<BlockedUser>, never>> {
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
