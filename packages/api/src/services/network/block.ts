import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories/network/follow";
import { FriendRepository } from "../../repositories/network/friend";
import { BlockRepository } from "../../repositories/user/block";
import { UserRepository } from "../../repositories/user/user";
import { FollowService } from "./follow";
import { FriendService } from "./friend";

export class BlockService {
  private userRepository = new UserRepository();
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private blockRepository = new BlockRepository();

  private followService = new FollowService();
  private friendService = new FriendService();

  async blockUser(userId: string, userIdBeingBlocked: string) {
    const followingUserBeingBlocked = await this.followService.isFollowing(
      userId,
      userIdBeingBlocked,
    );
    const followedByUserBeingBlocked = await this.followService.isFollowing(
      userIdBeingBlocked,
      userId,
    );
    const isFriends = await this.friendService.isFriends(
      userId,
      userIdBeingBlocked,
    );

    if (followingUserBeingBlocked) {
      const unfollow = await this.followRepository.removeFollower(
        userId,
        userIdBeingBlocked,
      );
      if (!unfollow) {
        console.error(
          `SERVICE ERROR: Failed to remove follower "${userIdBeingBlocked}" for user "${userId}"`,
        );
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FOLLOWER,
          "Failed to remove follower",
        );
      }
    }

    if (followedByUserBeingBlocked) {
      const removeFollower = await this.followRepository.removeFollower(
        userIdBeingBlocked,
        userId,
      );
      if (!removeFollower) {
        console.error(
          `SERVICE ERROR: Failed to remove follower "${userId}" for user "${userIdBeingBlocked}"`,
        );
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FOLLOWER,
          "Failed to remove follower",
        );
      }
    }

    if (isFriends) {
      const unfriend = await this.friendRepository.removeFriend(
        userId,
        userIdBeingBlocked,
      );
      if (!unfriend) {
        console.error(
          `SERVICE ERROR: Failed to remove friend "${userIdBeingBlocked}" for user "${userId}"`,
        );
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FRIEND,
          "Failed to remove friend",
        );
      }
    }

    const result = await this.blockRepository.blockUser(
      userId,
      userIdBeingBlocked,
    );
    if (!result) {
      console.error(
        `SERVICE ERROR: Failed to block user "${userIdBeingBlocked}" for user "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_BLOCK_USER,
        "Failed to block user",
      );
    }
  }

  async unblockUser(userId: string, blockedUserId: string) {
    const unblock = await this.blockRepository.unblockUser(
      userId,
      blockedUserId,
    );
    if (!unblock) {
      console.error(
        `SERVICE ERROR: Failed to unblock user "${blockedUserId}" for user "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_UNBLOCK_USER,
        "Failed to unblock user",
      );
    }
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
}
