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

  async blockUser(userId: string, userIdBeingBlocked: string) {
    if (userId === userIdBeingBlocked) {
      throw new DomainError(
        ErrorCode.CANNOT_FOLLOW_SELF,
        "Cannot block yourself",
      );
    }

    // Check if there is already a blocked relationship
    const [isBlocked, isBlockedByOther] = await Promise.all([
      this.blockRepository.getBlockedUser(userId, userIdBeingBlocked),
      this.blockRepository.getBlockedUser(userIdBeingBlocked, userId),
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
      this.followService.isFollowing(userId, userIdBeingBlocked),
      this.followService.isFollowing(userIdBeingBlocked, userId),
      this.friendService.friendshipExists(userId, userIdBeingBlocked),
      this.friendRepository.getFriendRequest(userId, userIdBeingBlocked),
      this.followRepository.getFollower(userId, userIdBeingBlocked),
      this.friendRepository.getFriendRequest(userIdBeingBlocked, userId),
      this.followRepository.getFollower(userIdBeingBlocked, userId),
      this.followRepository.getFollowRequest(userId, userIdBeingBlocked),
      this.followRepository.getFollowRequest(userIdBeingBlocked, userId),
    ]);

    // Clean up all relationships
    const cleanupPromises: Promise<unknown>[] = [];

    // Remove following relationships and update stats
    if (followingUserBeingBlocked) {
      cleanupPromises.push(
        this.followRepository.removeFollower(userId, userIdBeingBlocked),
        this.profileStatsRepository.decrementFollowingCount(userId, 1),
      );
    }

    if (followedByUserBeingBlocked) {
      cleanupPromises.push(
        this.followRepository.removeFollower(userIdBeingBlocked, userId),
        this.profileStatsRepository.decrementFollowerCount(userId, 1),
      );
    }

    // Remove friendship and update stats
    if (isFriends) {
      cleanupPromises.push(
        this.friendRepository.removeFriend(userId, userIdBeingBlocked),
        this.profileStatsRepository.decrementFriendsCount(userId, 1),
        this.profileStatsRepository.decrementFriendsCount(
          userIdBeingBlocked,
          1,
        ),
      );
    }

    // Clean up any pending friend requests
    if (userFriendRequest) {
      cleanupPromises.push(
        this.friendRepository.deleteFriendRequest(userId, userIdBeingBlocked),
      );
    }

    if (blockedUserFriendRequest) {
      cleanupPromises.push(
        this.friendRepository.deleteFriendRequest(userIdBeingBlocked, userId),
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
        this.followRepository.removeFollower(userId, userIdBeingBlocked),
      );
    }

    if (blockedUserFollowRequest) {
      cleanupPromises.push(
        this.followRepository.removeFollower(userIdBeingBlocked, userId),
      );
    }

    // Clean up notifications between the users
    cleanupPromises.push(
      this.notificationsRepository.deleteNotificationsBetweenUsers(
        userId,
        userIdBeingBlocked,
      ),
    );

    try {
      // Execute all cleanup operations and create block
      await Promise.all([
        ...cleanupPromises,
        this.blockRepository.blockUser(userId, userIdBeingBlocked),
      ]);
    } catch (error) {
      throw new DomainError(
        ErrorCode.FAILED_TO_BLOCK_USER,
        "Failed to block user",
        error,
      );
    }
  }

  async unblockUser(userId: string, blockedUserId: string) {
    const isBlocked = await this.blockRepository.getBlockedUser(
      userId,
      blockedUserId,
    );

    if (!isBlocked) {
      throw new DomainError(
        ErrorCode.FAILED_TO_CHECK_RELATIONSHIP,
        "User is not blocked",
      );
    }

    try {
      await this.blockRepository.unblockUser(userId, blockedUserId);
    } catch (error) {
      throw new DomainError(
        ErrorCode.FAILED_TO_UNBLOCK_USER,
        "Failed to unblock user",
        error,
      );
    }
  }

  async isUserBlocked(userId: string, blockedUserId: string) {
    const blockedUser = await this.blockRepository.getBlockedUser(
      userId,
      blockedUserId,
    );
    return !!blockedUser;
  }

  async areEitherUsersBlocked(userId: string, otherUserId: string) {
    const [userBlocked, otherUserBlocked] = await Promise.all([
      this.blockRepository.getBlockedUser(userId, otherUserId),
      this.blockRepository.getBlockedUser(otherUserId, userId),
    ]);
    return !!userBlocked || !!otherUserBlocked;
  }
}
