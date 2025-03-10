import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  FriendRepository,
  NotificationsRepository,
  ProfileStatsRepository,
} from "../../repositories";
import { FollowService } from "./follow";
import { FriendService } from "./friend";

export class BlockService {
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private blockRepository = new BlockRepository();
  private profileStatsRepository = new ProfileStatsRepository();
  private notificationsRepository = new NotificationsRepository();

  private followService = new FollowService();
  private friendService = new FriendService();

  async blockUser({
    userId,
    userIdBeingBlocked,
  }: {
    userId: string;
    userIdBeingBlocked: string;
  }) {
    if (userId === userIdBeingBlocked) {
      throw new DomainError(
        ErrorCode.CANNOT_FOLLOW_SELF,
        "Cannot block yourself",
      );
    }

    // Check if there is already a blocked relationship
    const [isBlocked, isBlockedByOther] = await Promise.all([
      this.blockRepository.getBlockedUser({
        userId,
        blockedUserId: userIdBeingBlocked,
      }),
      this.blockRepository.getBlockedUser({
        userId: userIdBeingBlocked,
        blockedUserId: userId,
      }),
    ]);

    if (isBlocked) {
      throw new DomainError(
        ErrorCode.RELATIONSHIP_ALREADY_EXISTS,
        "User already blocked",
      );
    }

    // Get all current relationships
    const [
      followingUserBeingBlocked,
      followedByUserBeingBlocked,
      isFriends,
      userFriendRequest,
      userFollowRequest,
      blockedUserFriendRequest,
      blockedUserFollowRequest,
      // Add follow request checks for private accounts
      outgoingFollowRequest,
      incomingFollowRequest,
    ] = await Promise.all([
      this.followService.isFollowing({
        senderId: userId,
        recipientId: userIdBeingBlocked,
      }),
      this.followService.isFollowing({
        senderId: userIdBeingBlocked,
        recipientId: userId,
      }),
      this.friendService.friendshipExists({
        userIdA: userId,
        userIdB: userIdBeingBlocked,
      }),
      this.friendRepository.getFriendRequest({
        senderId: userId,
        recipientId: userIdBeingBlocked,
      }),
      this.followRepository.getFollower({
        followerId: userId,
        followeeId: userIdBeingBlocked,
      }),
      this.friendRepository.getFriendRequest({
        senderId: userIdBeingBlocked,
        recipientId: userId,
      }),
      this.followRepository.getFollower({
        followerId: userIdBeingBlocked,
        followeeId: userId,
      }),
      this.followRepository.getFollowRequest({
        senderId: userId,
        recipientId: userIdBeingBlocked,
      }),
      this.followRepository.getFollowRequest({
        senderId: userIdBeingBlocked,
        recipientId: userId,
      }),
    ]);

    // Clean up all relationships
    const cleanupPromises: Promise<unknown>[] = [];

    // Remove following relationships and update stats
    if (followingUserBeingBlocked) {
      cleanupPromises.push(
        this.followRepository.removeFollower({
          followerId: userId,
          followeeId: userIdBeingBlocked,
        }),
        this.profileStatsRepository.decrementFollowingCount({
          userId,
          amount: 1,
        }),
      );
    }

    if (followedByUserBeingBlocked) {
      cleanupPromises.push(
        this.followRepository.removeFollower({
          followerId: userIdBeingBlocked,
          followeeId: userId,
        }),
        this.profileStatsRepository.decrementFollowerCount({
          userId,
          amount: 1,
        }),
      );
    }

    // Remove friendship and update stats
    if (isFriends) {
      cleanupPromises.push(
        this.friendRepository.removeFriend({
          userIdA: userId,
          userIdB: userIdBeingBlocked,
        }),
        this.profileStatsRepository.decrementFriendsCount({
          userId,
          amount: 1,
        }),
        this.profileStatsRepository.decrementFriendsCount({
          userId: userIdBeingBlocked,
          amount: 1,
        }),
      );
    }

    // Clean up any pending friend requests
    if (userFriendRequest) {
      cleanupPromises.push(
        this.friendRepository.deleteFriendRequest({
          senderId: userId,
          recipientId: userIdBeingBlocked,
        }),
      );
    }

    if (blockedUserFriendRequest) {
      cleanupPromises.push(
        this.friendRepository.deleteFriendRequest({
          senderId: userIdBeingBlocked,
          recipientId: userId,
        }),
      );
    }

    // Clean up any pending follow requests
    if (outgoingFollowRequest) {
      cleanupPromises.push(
        this.followRepository.removeFollowRequest(userId, userIdBeingBlocked),
      );
    }

    if (incomingFollowRequest) {
      cleanupPromises.push(
        this.followRepository.removeFollowRequest(userIdBeingBlocked, userId),
      );
    }

    // Clean up any existing follower relationships
    if (userFollowRequest) {
      cleanupPromises.push(
        this.followRepository.removeFollower({
          followerId: userId,
          followeeId: userIdBeingBlocked,
        }),
      );
    }

    if (blockedUserFollowRequest) {
      cleanupPromises.push(
        this.followRepository.removeFollower({
          followerId: userIdBeingBlocked,
          followeeId: userId,
        }),
      );
    }

    // Clean up notifications between the users
    cleanupPromises.push(
      this.notificationsRepository.deleteNotificationsBetweenUsers({
        userIdA: userId,
        userIdB: userIdBeingBlocked,
      }),
    );

    try {
      // Execute all cleanup operations and create block
      await Promise.all([
        ...cleanupPromises,
        this.blockRepository.blockUser({
          userId,
          blockedUserId: userIdBeingBlocked,
        }),
      ]);
    } catch (error) {
      throw new DomainError(
        ErrorCode.FAILED_TO_BLOCK_USER,
        "Failed to block user",
        error,
      );
    }
  }

  async unblockUser({
    userId,
    blockedUserId,
  }: {
    userId: string;
    blockedUserId: string;
  }) {
    const isBlocked = await this.blockRepository.getBlockedUser({
      userId,
      blockedUserId,
    });

    if (!isBlocked) {
      throw new DomainError(
        ErrorCode.FAILED_TO_CHECK_RELATIONSHIP,
        "User is not blocked",
      );
    }

    try {
      await this.blockRepository.unblockUser({ userId, blockedUserId });
    } catch (error) {
      throw new DomainError(
        ErrorCode.FAILED_TO_UNBLOCK_USER,
        "Failed to unblock user",
        error,
      );
    }
  }

  async areEitherUsersBlocked({
    userId,
    otherUserId,
  }: {
    userId: string;
    otherUserId: string;
  }) {
    const [userBlocked, otherUserBlocked] = await Promise.all([
      this.blockRepository.getBlockedUser({
        userId,
        blockedUserId: otherUserId,
      }),
      this.blockRepository.getBlockedUser({
        userId: otherUserId,
        blockedUserId: userId,
      }),
    ]);
    return !!userBlocked || !!otherUserBlocked;
  }
}
