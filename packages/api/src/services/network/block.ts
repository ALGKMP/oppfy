import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  FriendRepository,
} from "../../repositories";
import { FollowService } from "./follow";
import { FriendService } from "./friend";

export class BlockService {
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
    const isFriends = await this.friendService.friendshipExists(
      userId,
      userIdBeingBlocked,
    );

    if (followingUserBeingBlocked) {
      await this.followRepository.removeFollower(userId, userIdBeingBlocked);
    }

    if (followedByUserBeingBlocked) {
      await this.followRepository.removeFollower(userIdBeingBlocked, userId);
    }

    if (isFriends) {
      await this.friendRepository.removeFriend(userId, userIdBeingBlocked);
    }

    const isBlocked = await this.blockRepository.getBlockedUser(
      userId,
      userIdBeingBlocked,
    );

    if (isBlocked) {
      console.error(
        `SERVICE ERROR: User "${userId}" already blocked user "${userIdBeingBlocked}"`,
      );
      throw new DomainError(
        ErrorCode.RELATIONSHIP_ALREADY_EXISTS,
        "User already blocked",
      );
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
