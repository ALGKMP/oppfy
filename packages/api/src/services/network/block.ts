import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories/follow";
import { FriendRepository } from "../../repositories/friend";
import { UserRepository } from "../../repositories/user";
import { FollowService } from "./follow";
import { FriendService } from "./friend";


export class BlockService {
  private userRepository = new UserRepository();
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();

  private followService = new FollowService();
  private friendService = new FriendService();

  async blockUser(userId: string, userIdBeingBlocked: string) {
    const followingUserBeingBlocked = await this.followService.isFollowing(userId, userIdBeingBlocked);
    const followedByUserBeingBlocked = await this.followService.isFollowing(userIdBeingBlocked, userId);
    const isFriends = await this.friendService.isFriends(userId, userIdBeingBlocked);

    if (followingUserBeingBlocked) {
      const unfollow = await this.followRepository.removeFollower(userId, userIdBeingBlocked);
      if (!unfollow) {
        throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOWER, 'Failed to remove follower');
      }
    }

    if (followedByUserBeingBlocked) {
      const removeFollower = await this.followRepository.removeFollower(userIdBeingBlocked, userId);
      if (!removeFollower) {
        throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOWER, 'Failed to remove follower');
      }
    }

    if (isFriends) {
      const unfriend = await this.friendRepository.removeFriend(userId, userIdBeingBlocked);
      if (!unfriend) {
        throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FRIEND, 'Failed to remove friend');
      }
    }

    const result = await this.userRepository.blockUser(userId, userIdBeingBlocked);
    if (!result) {
      throw new DomainError(ErrorCode.FAILED_TO_BLOCK_USER, 'Failed to block user');
    }
  }

  async unblockUser(userId: string, blockedUserId: string) {
    const unblock = await this.userRepository.unblockUser(userId, blockedUserId);
    if (!unblock) {
      throw new DomainError(ErrorCode.FAILED_TO_UNBLOCK_USER, 'Failed to unblock user');
    }
  }

  async isUserBlocked(userId: string, blockedUserId: string) {
    const blockedUser = await this.userRepository.getBlockedUser(userId, blockedUserId);
    if (!blockedUser) {
      throw new DomainError(ErrorCode.FAILED_TO_CHECK_RELATIONSHIP, 'Failed to check relationship');
    }
    return !!blockedUser;
  }
}
