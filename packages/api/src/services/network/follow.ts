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
    await Promise.all(
      recipientIds.map((recipientId) => this.followUser(senderId, recipientId)),
    );
  }

  async followUser(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FOLLOW_SELF);
    }

    const isFollowing = await this.isFollowing(senderId, recipientId);

    if (isFollowing) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FOLLOWED,
        `User "${senderId}" is already following "${recipientId}"`,
      );
    }

    const sender = await this.userService.getUser(senderId);
    const recipient = await this.userService.getUser(recipientId);

    const senderProfile = await this.profileRepository.getProfile(
      sender.profileId,
    );

    if (senderProfile === undefined) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        `Profile not found for user ID "${senderId}"`,
      );
    }

    if (recipient.privacySetting === "private") {
      await this.followRepository.createFollowRequest(senderId, recipientId);
      await this.notificationsService.storeNotification(
        sender.id,
        recipient.id,
        {
          eventType: "followRequest",
          entityType: "profile",
          entityId: sender.id,
        },
      );

      const { followRequests } =
        await this.notificationsService.getNotificationSettings(recipient.id);

      if (followRequests) {
        await this.notificationsService.sendNotification(
          sender.id,
          recipient.id,
          {
            title: "Follow Request",
            body: `${senderProfile.username} has sent you a follow request.`,

            entityType: "profile",
            entityId: sender.id,
          },
        );
      }
      return;
    }

    await this.followRepository.createFollower(senderId, recipientId);

    await this.notificationsService.storeNotification(sender.id, recipient.id, {
      eventType: "follow",
      entityType: "profile",
      entityId: sender.id,
    });

    const { followRequests } =
      await this.notificationsService.getNotificationSettings(recipient.id);

    if (!followRequests) {
      return;
    }

    await this.notificationsService.sendNotification(sender.id, recipient.id, {
      title: "New follower",
      body: `${senderProfile.username} is now following you.`,

      entityType: "profile",
      entityId: sender.id,
    });
  }

  async unfollowUser(senderId: string, recipientId: string) {
    if (senderId === recipientId) return true; // Temporary fix
    const isFollowing = await this.isFollowing(senderId, recipientId);

    if (!isFollowing) {
      throw new DomainError(
        ErrorCode.FOLLOW_NOT_FOUND,
        "Follow relationship not found.",
      );
    }

    await this.followRepository.removeFollower(senderId, recipientId);
    await this.notificationsService.deleteNotification(senderId, "follow");
  }

  async acceptFollowRequest(senderId: string, recipientId: string) {
    const followRequest = await this.followRepository.getFollowRequest(
      senderId,
      recipientId,
    );

    if (followRequest === undefined) {
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        `Follow request from "${senderId}" to "${recipientId} not found"`,
      );
    }

    await this.followRepository.removeFollowRequest(senderId, recipientId);
    await this.followRepository.createFollower(senderId, recipientId);

    const recipient = await this.userService.getUser(recipientId);
    const recipientProfile = await this.profileRepository.getProfile(
      recipient.profileId,
    );

    if (recipientProfile === undefined) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        `Profile not found for user ID "${recipientId}"`,
      );
    }

    await this.notificationsService.storeNotification(recipientId, senderId, {
      eventType: "follow",
      entityType: "profile",
      entityId: recipient.id,
    });

    const { followRequests } =
      await this.notificationsService.getNotificationSettings(senderId);

    if (followRequests) {
      await this.notificationsService.sendNotification(recipientId, senderId, {
        title: "Follow Request Accepted",
        body: `${recipientProfile.username} has accepted your follow request`,
        entityType: "profile",
        entityId: recipient.id,
      });
    }
  }

  async declineFollowRequest(
    requestSenderId: string,
    requestRecipientId: string,
  ) {
    const followRequestExists = await this.followRepository.getFollowRequest(
      requestSenderId,
      requestRecipientId,
    );

    if (!followRequestExists) {
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        `Follow request from "${requestSenderId}" to "${requestRecipientId}" not found`,
      );
    }

    await this.followRepository.removeFollowRequest(
      requestSenderId,
      requestRecipientId,
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
