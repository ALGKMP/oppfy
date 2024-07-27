import { PrivateFollowState, PublicFollowState } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories/network/follow";
import { ProfileRepository } from "../../repositories/profile/profile";
import { NotificationsService } from "../user/notifications";
import { UserService } from "../user/user";

export class FollowService {
  private followRepository = new FollowRepository();
  private profileRepository = new ProfileRepository();

  private userService = new UserService();
  private notificationsService = new NotificationsService();

  async isFollowing(senderId: string, recipientId: string) {
    if (senderId === recipientId) return true; // Temporary fix
    return !!(await this.followRepository.getFollower(senderId, recipientId));
  }

  async followUsers(senderId: string, recipientIds: string[]) {
    const results = await Promise.allSettled(
      recipientIds.map((recipientId) => this.followUser(senderId, recipientId)),
    );

    console.log("results", results);
  }

  // @tony: Example for noti handling
  async followUser(senderId: string, recipientId: string) {
    const isFollowing = await this.isFollowing(senderId, recipientId);

    if (isFollowing) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FOLLOWED,
        `User "${senderId}" is already following "${recipientId}"`,
      );
    }

    const sender = await this.userService.getUser(senderId);
    const recipient = await this.userService.getUser(recipientId);

    if (recipient.privacySetting === "private") {
      await this.followRepository.createFollowRequest(senderId, recipientId);
      return;
    }

    await this.followRepository.addFollower(senderId, recipientId);

    const profile = await this.profileRepository.getProfile(sender.profileId);

    if (profile === undefined) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        `Profile not found for user ID "${recipientId}"`,
      );
    }

    await this.notificationsService.storeNotification(sender.id, recipient.id, {
      eventType: "follow",
      entityType: "profile",
      entityId: String(sender.profileId),
    });

    const { followRequests } =
      await this.notificationsService.getNotificationSettings(recipient.id);

    if (!followRequests) {
      return;
    }

    await this.notificationsService.sendNotification(sender.id, recipient.id, {
      title: "New follower",
      body: `${profile.username} is now following you.`,

      entityType: "profile",
      entityId: String(sender.profileId),
    });
  }

  async unfollowUser(senderId: string, recipientId: string) {
    if (senderId === recipientId) return true; // Temporary fix
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

    await this.followRepository.removeFollower(senderId, recipientId);

    // @tony we also need to delete the stored event to avoid duplication
    await this.notificationsService.deleteNotification(senderId, "follow");
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

    await this.followRepository.removeFollowRequest(senderId, recipientId);

    await this.followRepository.addFollower(senderId, recipientId);
  }

  async declineFollowRequest(
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

    return await this.followRepository.removeFollower(followerToRemove, userId);
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

  public async countFollowRequests(userId: string) {
    const count = await this.followRepository.countFollowRequests(userId);
    if (count === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count follow requests for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOW_REQUESTS,
        "Failed to count follow requests.",
      );
    }
    return count;
  }
}
