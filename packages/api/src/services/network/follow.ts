import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories/follow";
import { UserRepository } from "../../repositories/user";

export class FollowService {
  private followRepository = new FollowRepository();
  private userRepository = new UserRepository();

  async isFollowing(userId: string, recipientId: string) {
    return !!(await this.followRepository.getFollower(userId, recipientId));
  }

  async followUser(senderId: string, recipientId: string) {
    const alreadyFollowing = await this.isFollowing(senderId, recipientId);
    if (alreadyFollowing) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FOLLOWED,
        "User already followed",
      );
    }
    const sender = await this.userRepository.getUser(senderId);
    const recipient = await this.userRepository.getUser(recipientId);
    if (!recipient || !sender) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    if (recipient.privacySetting === "private") {
      const result = await this.followRepository.createFollowRequest(
        senderId,
        recipientId,
      );
      if (!result) {
        throw new DomainError(
          ErrorCode.FAILED_TO_REQUEST_FOLLOW,
          "Failed to request follow",
        );
      }
    }
    const result = await this.followRepository.addFollower(
      senderId,
      recipientId,
    );
    if (!result) {
      throw new DomainError(
        ErrorCode.FAILED_TO_FOLLOW_USER,
        "Failed to follow user",
      );
    }
  }

  async unfollowUser(senderId: string, recipientId: string) {
    const isFollowing = await this.isFollowing(senderId, recipientId);
    if (!isFollowing) {
      throw new DomainError(ErrorCode.FOLLOW_NOT_FOUND, "Follow not found");
    }
    const result = await this.followRepository.removeFollower(
      senderId,
      recipientId,
    );
    if (!result) {
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FOLLOWER,
        "Failed to remove follower",
      );
    }
  }

  async acceptFollowRequest(senderId: string, recipientId: string) {
    const followRequestExists = await this.followRepository.getFollowRequest(
      senderId,
      recipientId,
    );
    if (!followRequestExists) {
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        "Follow request not found",
      );
    }
    const result = await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
    if (!result) {
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FOLLOW_REQUEST,
        "Failed to remove follow request",
      );
    }
    const result2 = await this.followRepository.addFollower(
      senderId,
      recipientId,
    );
    if (!result2) {
      throw new DomainError(
        ErrorCode.FAILED_TO_FOLLOW_USER,
        "Failed to follow user",
      );
    }
  }

  async rejectFollowRequest(senderId: string, recipientId: string) {
    const followRequestExists = await this.followRepository.getFollowRequest(
      senderId,
      recipientId,
    );
    if (!followRequestExists) {
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        "Follow request not found",
      );
    }
    const result = await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
    if (!result) {
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FOLLOW_REQUEST,
        "Failed to remove follow request",
      );
    }
  }

  async cancelFollowRequest(senderId: string, recipientId: string) {
    const followRequestExists = await this.followRepository.getFollowRequest(
      senderId,
      recipientId,
    );
    if (!followRequestExists) {
      throw new DomainError(ErrorCode.FOLLOW_REQUEST_NOT_FOUND);
    }

    const deleteResult = await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
    if (!deleteResult) {
      throw new DomainError(ErrorCode.FAILED_TO_CANCEL_FOLLOW_REQUEST);
    }
  }


  async removeFollower(userId: string, followerToRemove: string) {
    const followerExists = await this.followRepository.getFollower(
      followerToRemove,
      userId,
    );
    if (!followerExists) {
      throw new DomainError(ErrorCode.FOLLOW_NOT_FOUND, "Follow not found");
    }
    const removeResult = await this.followRepository.removeFollower(
      followerToRemove,
      userId,
    );
    if (!removeResult) {
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FOLLOWER,
        "Failed to remove follower",
      );
    }
  }
}
