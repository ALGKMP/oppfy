import { sns } from "@oppfy/sns";
import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories/network/follow";
import { FriendRepository } from "../../repositories/network/friend";
import { NotificationsRepository } from "../../repositories/user/notifications";
import { ProfileRepository } from "../../repositories/user/profile";
import { UserRepository } from "../../repositories/user/user";

export class FollowService {
  private followRepository = new FollowRepository();
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private notificationsRepository = new NotificationsRepository();
  private friendRepository = new FriendRepository();

  async isFollowing(senderId: string, recipientId: string) {
    if (senderId === recipientId) return true; // Temporary fix
    return !!(await this.followRepository.getFollower(senderId, recipientId));
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

    const sender = await this.userRepository.getUser(senderId);
    const recipient = await this.userRepository.getUser(recipientId);

    if (!sender || !recipient) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "One or both users not found",
      );
    }

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

      const settings =
        await this.notificationsRepository.getNotificationSettings(
          recipient.notificationSettingsId,
        );

      if (settings?.followRequests) {
        const pushTokens =
          await this.notificationsRepository.getPushTokens(recipientId);
        await sns.sendFollowRequestNotification(
          pushTokens,
          sender.id,
          recipient.id,
          senderProfile.username,
        );
      }
      return;
    }

    await this.followRepository.createFollower(senderId, recipientId);

    await this.notificationsRepository.storeNotification(
      sender.id,
      recipient.id,
      {
        eventType: "follow",
        entityType: "profile",
        entityId: sender.id,
      },
    );

    const settings = await this.notificationsRepository.getNotificationSettings(
      recipient.notificationSettingsId,
    );

    if (settings?.followRequests) {
      const pushTokens =
        await this.notificationsRepository.getPushTokens(recipientId);
      await sns.sendFollowAcceptedNotification(
        pushTokens,
        sender.id,
        recipient.id,
        senderProfile.username,
      );
    }
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

    const friendship = await this.friendRepository.getFriendship(
      senderId,
      recipientId,
    );

    const outboundFollowRequest = await this.followRepository.getFollowRequest(
      senderId,
      recipientId,
    );

    const outboundFriendRequest = await this.friendRepository.getFriendRequest(
      senderId,
      recipientId,
    );

    if (outboundFollowRequest) {
      await this.followRepository.removeFollowRequest(senderId, recipientId);
    } else if (friendship) {
      await this.friendRepository.removeFriend(senderId, recipientId);
    } else if (outboundFriendRequest) {
      await this.friendRepository.deleteFriendRequest(senderId, recipientId);
    }
    await this.followRepository.removeFollower(senderId, recipientId);
  }

  async acceptFollowRequest(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FOLLOW_SELF);
    }

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

    const recipient = await this.userRepository.getUser(recipientId);

    if (!recipient) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        `User not found: ${recipientId}`,
      );
    }

    const recipientProfile = await this.profileRepository.getProfile(
      recipient.profileId,
    );

    if (recipientProfile === undefined) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        `Profile not found for user ID "${recipientId}"`,
      );
    }

    await this.notificationsRepository.storeNotification(
      senderId,
      recipientId,
      {
        eventType: "follow",
        entityType: "profile",
        entityId: senderId,
      },
    );

    const settings =
      await this.notificationsRepository.getNotificationSettings(senderId);

    if (settings?.followRequests) {
      const pushTokens =
        await this.notificationsRepository.getPushTokens(senderId);
      await sns.sendFollowAcceptedNotification(
        pushTokens,
        recipientId,
        senderId,
        recipientProfile.username,
      );
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

    const friendRequestExists = await this.friendRepository.getFriendRequest(
      requestSenderId,
      requestRecipientId,
    );

    if (friendRequestExists) {
      await this.friendRepository.deleteFriendRequest(
        requestSenderId,
        requestRecipientId,
      );
    }
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

    await this.followRepository.removeFollower(followerToRemove, userId);

    // Check if there's a friendship and remove it if exists
    const friendship = await this.friendRepository.getFriendship(
      userId,
      followerToRemove,
    );
    if (friendship) {
      await this.friendRepository.removeFriend(userId, followerToRemove);
    }
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
        ? sharedValidators.user.PublicFollowState.Enum.Following
        : sharedValidators.user.PublicFollowState.Enum.NotFollowing;
    } else {
      if (isFollowing) {
        return sharedValidators.user.PrivateFollowState.Enum.Following;
      } else if (followRequest) {
        return sharedValidators.user.PrivateFollowState.Enum.OutboundRequest;
      } else {
        return sharedValidators.user.PrivateFollowState.Enum.NotFollowing;
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
