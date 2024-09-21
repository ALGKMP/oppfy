import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  FriendRepository,
  ProfileStatsRepository,
} from "../../repositories";
import { FollowService } from "./follow";
import { FriendService } from "./friend";

export class BlockService {
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private blockRepository = new BlockRepository();
  private profileStatsRepository = new ProfileStatsRepository();

  private followService = new FollowService();
  private friendService = new FriendService();

  async blockUser(userId: string, userIdBeingBlocked: string) {
    // Check if there is already a blocked relationship
    const isBlocked = await this.blockRepository.getBlockedUser(
      userId,
      userIdBeingBlocked,
    );

    const isBlockedByUserBeingBlocked =
      await this.blockRepository.getBlockedUser(userIdBeingBlocked, userId);

    if (isBlocked ?? isBlockedByUserBeingBlocked) {
      console.error(
        `SERVICE ERROR: User "${userId}" already blocked user "${userIdBeingBlocked}"`,
      );
      throw new DomainError(
        ErrorCode.RELATIONSHIP_ALREADY_EXISTS,
        "User already blocked",
      );
    }

    // Check if there is a following relationship
    const followingUserBeingBlocked = await this.followService.isFollowing(
      userId,
      userIdBeingBlocked,
    );

    // Check if there is a following relationship
    const followedByUserBeingBlocked = await this.followService.isFollowing(
      userIdBeingBlocked,
      userId,
    );

    // Check if there is a friendship relationship
    const isFriends = await this.friendService.friendshipExists(
      userId,
      userIdBeingBlocked,
    );

    const userFriendRequestToBlockedUser =
      await this.friendRepository.getFriendRequest(userId, userIdBeingBlocked);

    const userFollowRequestToBlockedUser =
      await this.followRepository.getFollower(userId, userIdBeingBlocked);

    const blockedUserFriendRequestToUser =
      await this.friendRepository.getFriendRequest(userIdBeingBlocked, userId);

    const blockedUserFollowRequestToUser =
      await this.followRepository.getFollower(userIdBeingBlocked, userId);

    // Remove the following relationship
    if (followingUserBeingBlocked) {
      await this.followRepository.removeFollower(userId, userIdBeingBlocked);
      await this.profileStatsRepository.decrementFollowerCount(userId, 1);
    }

    // Remove the following relationship
    if (followedByUserBeingBlocked) {
      await this.followRepository.removeFollower(userIdBeingBlocked, userId);
      await this.profileStatsRepository.decrementFollowingCount(userId, 1);
    }

    // Remove the friendship relationship
    if (isFriends) {
      await this.friendRepository.removeFriend(userId, userIdBeingBlocked);
      await this.profileStatsRepository.decrementFriendsCount(userId, 1);
      await this.profileStatsRepository.decrementFriendsCount(
        userIdBeingBlocked,
        1,
      );
    }

    if (userFriendRequestToBlockedUser) {
      await this.friendRepository.deleteFriendRequest(userId, userIdBeingBlocked);
    }

    if (userFollowRequestToBlockedUser) {
      await this.followRepository.removeFollowRequest(userId, userIdBeingBlocked);
    }

    if (blockedUserFriendRequestToUser) {
      await this.friendRepository.deleteFriendRequest(userIdBeingBlocked, userId);
    }

    if (blockedUserFollowRequestToUser) {
      await this.followRepository.removeFollowRequest(userIdBeingBlocked, userId);
    }

    await this.blockRepository.blockUser(userId, userIdBeingBlocked);
  }

  async unblockUser(userId: string, blockedUserId: string) {
    await this.blockRepository.unblockUser(userId, blockedUserId);
  }

  async isUserBlocked(userId: string, blockedUserId: string) {
    const blockedUser = await this.blockRepository.getBlockedUser(
      userId,
      blockedUserId,
    );
    if (!blockedUser) {
      console.error(
        `SERVICE ERROR: Failed to check relationship between user "${userId}" and blocked user "${blockedUserId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_CHECK_RELATIONSHIP,
        "Failed to check relationship",
      );
    }
    return !!blockedUser;
  }

  async areEitherUsersBlocked(userId: string, otherUserId: string) {
    const userBlocked = await this.blockRepository.getBlockedUser(
      userId,
      otherUserId,
    );
    const otherUserBlocked = await this.blockRepository.getBlockedUser(
      otherUserId,
      userId,
    );
    return !!userBlocked || !!otherUserBlocked;
  }
}
