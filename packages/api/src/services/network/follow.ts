import { PrivateFollowState, PublicFollowState } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories/network/follow";
import { UserRepository } from "../../repositories/user/user";

export class FollowService {
  private followRepository = new FollowRepository();
  private userRepository = new UserRepository();

  async isFollowing(userId: string, recipientId: string) {
    return !!(await this.followRepository.getFollower(userId, recipientId));
  }

  async followUser(senderId: string, recipientId: string) {
    const alreadyFollowing = await this.isFollowing(senderId, recipientId);
    if (alreadyFollowing) {
      console.error(
        `SERVICE ERROR: User "${senderId}" is already following "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.USER_ALREADY_FOLLOWED,
        "User is already following the recipient.",
      );
    }

    const sender = await this.userRepository.getUser(senderId);
    const recipient = await this.userRepository.getUser(recipientId);
    if (!recipient || !sender) {
      console.error(
        `SERVICE ERROR: User not found for sender ID "${senderId}" or recipient ID "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "Sender or recipient user not found.",
      );
    }

    if (recipient.privacySetting === "private") {
      const result = await this.followRepository.createFollowRequest(
        senderId,
        recipientId,
      );
      if (!result.insertId) {
        console.error(
          `SERVICE ERROR: Failed to create follow request from "${senderId}" to "${recipientId}"`,
        );
        throw new DomainError(
          ErrorCode.FAILED_TO_REQUEST_FOLLOW,
          "Failed to create follow request.",
        );
      }
    }

    const result = await this.followRepository.addFollower(
      senderId,
      recipientId,
    );
    if (!result.insertId) {
      console.error(
        `SERVICE ERROR: Failed to follow user "${recipientId}" by "${senderId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_FOLLOW_USER,
        "Failed to follow user.",
      );
    }
  }

  async unfollowUser(senderId: string, recipientId: string) {
    const isFollowing = await this.isFollowing(senderId, recipientId);
    if (!isFollowing) {
      console.error(
        `SERVICE ERROR: Follow relationship not found for sender ID "${senderId}" and recipient ID "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.FOLLOW_NOT_FOUND,
        "Follow relationship not found.",
      );
    }

    return await this.followRepository.removeFollower(
      senderId,
      recipientId,
    );
  }

  async acceptFollowRequest(senderId: string, recipientId: string) {
    const followRequestExists = await this.followRepository.getFollowRequest(
      senderId,
      recipientId,
    );
    if (!followRequestExists) {
      console.error(
        `SERVICE ERROR: Follow request not found from "${senderId}" to "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        "Follow request not found.",
      );
    }

    const result = await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
    if (!result.insertId) {
      console.error(
        `SERVICE ERROR: Failed to remove follow request from "${senderId}" to "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FOLLOW_REQUEST,
        "Failed to remove follow request.",
      );
    }

    const result2 = await this.followRepository.addFollower(
      senderId,
      recipientId,
    );
    if (!result2.insertId) {
      console.error(
        `SERVICE ERROR: Failed to add follower "${recipientId}" for sender ID "${senderId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_FOLLOW_USER,
        "Failed to add follower.",
      );
    }
  }

  async rejectFollowRequest(
    userIdBeingRejected: string,
    userIdRejecting: string,
  ) {
    const followRequestExists = await this.followRepository.getFollowRequest(
      userIdBeingRejected,
      userIdRejecting,
    );
    if (!followRequestExists) {
      console.error(
        `SERVICE ERROR: Follow request not found from "${userIdBeingRejected}" to "${userIdRejecting}"`,
      );
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        "Follow request not found.",
      );
    }

    return await this.followRepository.removeFollowRequest(
      userIdBeingRejected,
      userIdRejecting,
    );
  }

  async cancelFollowRequest(senderId: string, recipientId: string) {
    const followRequestExists = await this.followRepository.getFollowRequest(
      senderId,
      recipientId,
    );
    if (!followRequestExists) {
      console.error(
        `SERVICE ERROR: Follow request not found from "${senderId}" to "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        "Follow request not found.",
      );
    }

    return await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
  }

  async removeFollower(userId: string, followerToRemove: string) {
    const followerExists = await this.followRepository.getFollower(
      followerToRemove,
      userId,
    );
    if (!followerExists) {
      console.error(
        `SERVICE ERROR: Follow relationship not found for follower "${followerToRemove}" and user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FOLLOW_NOT_FOUND,
        "Follow relationship not found.",
      );
    }

    return await this.followRepository.removeFollower(
      followerToRemove,
      userId,
    );
    
  }

  public async determineFollowState(
    userId: string,
    targetUserId: string,
    privacySetting: "public" | "private",
  ) {
    const isFollowing = await this.followRepository.getFollower(
      userId,
      targetUserId,
    );
    const followRequest = await this.followRepository.getFollowRequest(
      userId,
      targetUserId,
    );

    if (privacySetting === "public") {
      return isFollowing
        ? PublicFollowState.Enum.Following
        : PublicFollowState.Enum.NotFollowing;
    } else {
      if (isFollowing) {
        return PrivateFollowState.Enum.Following;
      } else if (followRequest) {
        return PrivateFollowState.Enum.OutboundRequest;
      } else {
        const incomingRequest = await this.followRepository.getFollowRequest(
          targetUserId,
          userId,
        );
        return incomingRequest
          ? PrivateFollowState.Enum.IncomingRequest
          : PrivateFollowState.Enum.NotFollowing;
      }
    }
  }
}
