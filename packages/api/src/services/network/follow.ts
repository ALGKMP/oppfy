import { sns } from "@oppfy/sns";
import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories/network/follow";
import { FriendRepository } from "../../repositories/network/friend";
import { NotificationsRepository } from "../../repositories/user/notifications";
import { UserRepository } from "../../repositories/user/user";

export class FollowService {
  private followRepository = new FollowRepository();
  private userRepository = new UserRepository();
  private notificationsRepository = new NotificationsRepository();
  private friendRepository = new FriendRepository();

  async isFollowing({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    if (senderId === recipientId) return true; // Temporary fix
    return !!(await this.followRepository.isFollowing({
      followerId: senderId,
      followeeId: recipientId,
    }));
  }

  async followUser({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FOLLOW_SELF);
    }

    const isFollowing = await this.isFollowing({ senderId, recipientId });

    if (isFollowing) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FOLLOWED,
        `User "${senderId}" is already following "${recipientId}"`,
      );
    }

    const sender = await this.userRepository.getUserWithProfile({
      userId: senderId,
    });
    const recipient = await this.userRepository.getUserWithProfile({
      userId: recipientId,
    });

    if (!sender || !recipient) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "One or both users not found",
      );
    }

    if (recipient.privacySetting === "private") {
      await this.followRepository.createFollowRequest({
        senderId,
        recipientId,
      });

      const settings =
        await this.notificationsRepository.getNotificationSettings({
          notificationSettingsId: recipient.notificationSettingsId,
        });

      if (settings?.followRequests) {
        const pushTokens = await this.notificationsRepository.getPushTokens({
          userId: recipientId,
        });
        await sns.sendFollowRequestNotification(
          pushTokens,
          sender.id,
          recipient.id,
          sender.profile.username,
        );
      }
      return;
    }

    await this.followRepository.createFollower({
      senderUserId: senderId,
      recipientUserId: recipientId,
    });

    await this.notificationsRepository.storeNotification({
      senderId,
      recipientId,
      notificationData: {
        eventType: "follow",
        entityType: "profile",
        entityId: senderId,
      },
    });

    const settings = await this.notificationsRepository.getNotificationSettings(
      { notificationSettingsId: recipient.notificationSettingsId },
    );

    if (settings?.followRequests) {
      const pushTokens = await this.notificationsRepository.getPushTokens({
        userId: recipientId,
      });
      await sns.sendFollowAcceptedNotification(
        pushTokens,
        sender.id,
        recipient.id,
        sender.profile.username,
      );
    }
  }

  async unfollowUser({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    if (senderId === recipientId) return true; // Temporary fix
    const isFollowing = await this.isFollowing({ senderId, recipientId });

    if (!isFollowing) {
      throw new DomainError(
        ErrorCode.FOLLOW_NOT_FOUND,
        "Follow relationship not found.",
      );
    }

    const friendship = await this.friendRepository.getFriend({
      userIdA: senderId,
      userIdB: recipientId,
    });

    const outboundFollowRequest = await this.followRepository.getFollowRequest({
      senderId,
      recipientId,
    });

    const outboundFriendRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });

    if (outboundFollowRequest) {
      await this.followRepository.removeFollowRequest(senderId, recipientId);
    } else if (friendship) {
      await this.friendRepository.removeFriend({
        userIdA: senderId,
        userIdB: recipientId,
      });
    } else if (outboundFriendRequest) {
      await this.friendRepository.deleteFriendRequest({
        senderId,
        recipientId,
      });
    }
    await this.followRepository.removeFollower({
      followerId: senderId,
      followeeId: recipientId,
    });
  }

  async acceptFollowRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FOLLOW_SELF);
    }

    const followRequest = await this.followRepository.getFollowRequest({
      senderId,
      recipientId,
    });

    if (followRequest === undefined) {
      throw new DomainError(
        ErrorCode.FOLLOW_REQUEST_NOT_FOUND,
        `Follow request from "${senderId}" to "${recipientId} not found"`,
      );
    }

    await this.followRepository.removeFollowRequest(senderId, recipientId);
    await this.followRepository.createFollower({
      senderUserId: senderId,
      recipientUserId: recipientId,
    });

    const recipient = await this.userRepository.getUserWithProfile({
      userId: recipientId,
    });

    if (!recipient) {
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "Recipient user not found",
      );
    }

    await this.notificationsRepository.storeNotification({
      senderId,
      recipientId,
      notificationData: {
        eventType: "follow",
        entityType: "profile",
        entityId: senderId,
      },
    });

    const settings = await this.notificationsRepository.getNotificationSettings(
      { notificationSettingsId: senderId },
    );

    if (settings?.followRequests) {
      const pushTokens = await this.notificationsRepository.getPushTokens({
        userId: senderId,
      });
      await sns.sendFollowAcceptedNotification(
        pushTokens,
        recipientId,
        senderId,
        recipient.profile.username,
      );
    }
  }

  async declineFollowRequest({
    requestSenderId,
    requestRecipientId,
  }: {
    requestSenderId: string;
    requestRecipientId: string;
  }) {
    const followRequestExists = await this.followRepository.getFollowRequest({
      senderId: requestSenderId,
      recipientId: requestRecipientId,
    });

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

    const friendRequestExists = await this.friendRepository.getFriendRequest({
      senderId: requestSenderId,
      recipientId: requestRecipientId,
    });

    if (friendRequestExists) {
      await this.friendRepository.deleteFriendRequest({
        senderId: requestSenderId,
        recipientId: requestRecipientId,
      });
    }
  }

  async cancelFollowRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    const followRequestExists = await this.followRepository.getFollowRequest({
      senderId,
      recipientId,
    });
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

  async removeFollower({
    userId,
    followerToRemove,
  }: {
    userId: string;
    followerToRemove: string;
  }) {
    const followerExists = await this.followRepository.isFollowing({
      followerId: followerToRemove,
      followeeId: userId,
    });
    if (!followerExists) {
      console.error(
        `SERVICE ERROR: Follow relationship not found for follower "${followerToRemove}" and user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FOLLOW_NOT_FOUND,
        "Follow relationship not found.",
      );
    }

    await this.followRepository.removeFollower({
      followerId: followerToRemove,
      followeeId: userId,
    });

    // Check if there's a friendship and remove it if exists
    const friendship = await this.friendRepository.getFriend({
      userIdA: userId,
      userIdB: followerToRemove,
    });
    if (friendship) {
      await this.friendRepository.removeFriend({
        userIdA: userId,
        userIdB: followerToRemove,
      });
    }
  }

  public async determineFollowState({
    userId,
    targetUserId,
    privacySetting,
  }: {
    userId: string;
    targetUserId: string;
    privacySetting: "public" | "private";
  }) {
    const isFollowing = await this.followRepository.isFollowing({
      followerId: userId,
      followeeId: targetUserId,
    });
    const followRequest = await this.followRepository.getFollowRequest({
      senderId: userId,
      recipientId: targetUserId,
    });

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

  public async countFollowRequests({ userId }: { userId: string }) {
    const count = await this.followRepository.countFollowRequests({ userId });
    if (count === undefined) {
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FOLLOW_REQUESTS);
    }
    return count;
  }
}
