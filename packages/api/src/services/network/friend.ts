import { sns } from "@oppfy/sns";
import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories";
import { FriendRepository } from "../../repositories/network/friend";
import { NotificationsRepository } from "../../repositories/user/notifications";
import { ProfileRepository } from "../../repositories/user/profile";
import { UserRepository } from "../../repositories/user/user";

export class FriendService {
  private friendRepository = new FriendRepository();
  private profileRepository = new ProfileRepository();
  private followRepository = new FollowRepository();
  private userRepository = new UserRepository();
  private notificationsRepository = new NotificationsRepository();

  async isFollowing({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    if (senderId === recipientId) return true; // Temporary fix
    return !!(await this.followRepository.getFollower({
      followerId: senderId,
      followeeId: recipientId,
    }));
  }

  async sendFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FRIEND_SELF);
    }

    const friendshipExists = await this.friendshipExists({
      userIdA: senderId,
      userIdB: recipientId,
    });

    if (friendshipExists) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FRIENDS,
        `Users "${senderId}" and "${recipientId}" are already friends`,
      );
    }

    const friendRequest = await this.getFriendRequest({
      senderId,
      recipientId,
    });

    if (friendRequest) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_ALREADY_SENT,
        `Friend request already sent from "${senderId}" to "${recipientId}"`,
      );
    }

    const receivedFriendRequest = await this.getFriendRequest({
      senderId: recipientId,
      recipientId: senderId,
    });

    // Temporary fix
    if (receivedFriendRequest) {
      await this.acceptFriendRequest({
        senderId: recipientId,
        recipientId: senderId,
      });
      return;
    }

    const isFollowing = await this.isFollowing({ senderId, recipientId });

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

    if (!isFollowing) {
      if (recipient.privacySetting === "private") {
        await this.followRepository.createFollowRequest({
          senderId,
          recipientId,
        });
      } else {
        await this.followRepository.createFollower({
          senderUserId: senderId,
          recipientUserId: recipientId,
        });
      }
    }

    await this.friendRepository.createFriendRequest({ senderId, recipientId });

    const settings = await this.notificationsRepository.getNotificationSettings(
      { notificationSettingsId: recipient.notificationSettingsId },
    );

    if (settings?.friendRequests) {
      const pushTokens = await this.notificationsRepository.getPushTokens({
        userId: recipientId,
      });
      await sns.sendFriendRequestNotification(
        pushTokens,
        senderId,
        recipientId,
        sender.profile.username,
      );
    }
  }

  async acceptFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FRIEND_SELF);
    }

    const friendRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });

    if (friendRequest === undefined) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        `Friend request from "${senderId}" to "${recipientId}" not found`,
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

    await this.friendRepository.deleteFriendRequest({ senderId, recipientId });
    await this.friendRepository.createFriend({ senderId, recipientId });

    const senderFollowsRecipient = await this.followRepository.getFollower({
      followerId: senderId,
      followeeId: recipientId,
    });
    const recipientFollowsSender = await this.followRepository.getFollower({
      followerId: recipientId,
      followeeId: senderId,
    });

    if (!senderFollowsRecipient) {
      await this.followRepository.createFollower({
        senderUserId: senderId,
        recipientUserId: recipientId,
      });
    }

    if (!recipientFollowsSender) {
      await this.followRepository.createFollower({
        senderUserId: recipientId,
        recipientUserId: senderId,
      });

      // Store follow notification
      await this.notificationsRepository.storeNotification({
        senderId: recipientId,
        recipientId: senderId,
        notificationData: {
          eventType: "follow",
          entityType: "profile",
          entityId: recipientId,
        },
      });

      const settings =
        await this.notificationsRepository.getNotificationSettings({
          notificationSettingsId: sender.notificationSettingsId,
        });

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

    // Store friend notifications
    await this.notificationsRepository.storeNotification({
      senderId: recipientId,
      recipientId: senderId,
      notificationData: {
        eventType: "friend",
        entityType: "profile",
        entityId: recipient.id,
      },
    });

    await this.notificationsRepository.storeNotification({
      senderId,
      recipientId,
      notificationData: {
        eventType: "friend",
        entityType: "profile",
        entityId: recipient.id,
      },
    });

    const settings = await this.notificationsRepository.getNotificationSettings(
      { notificationSettingsId: sender.notificationSettingsId },
    );

    if (settings?.friendRequests) {
      const pushTokens = await this.notificationsRepository.getPushTokens({
        userId: senderId,
      });
      await sns.sendFriendAcceptedNotification(
        pushTokens,
        recipientId,
        senderId,
        recipient.profile.username,
      );
    }
  }

  async declineFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    const friendRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });

    if (friendRequest === undefined) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        `Friend request from "${senderId}" to "${recipientId}" not found`,
      );
    }

    await this.friendRepository.deleteFriendRequest({ senderId, recipientId });
  }

  async cancelFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    const friendRequest = await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });
    if (friendRequest === undefined) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        `Friend request from "${senderId}" to "${recipientId}" not found`,
      );
    }

    return await this.friendRepository.deleteFriendRequest({
      senderId,
      recipientId,
    });
  }

  async getFriendRequest({
    senderId,
    recipientId,
  }: {
    senderId: string;
    recipientId: string;
  }) {
    return await this.friendRepository.getFriendRequest({
      senderId,
      recipientId,
    });
  }

  async removeFriend({
    targetUserId,
    otherUserId,
  }: {
    targetUserId: string;
    otherUserId: string;
  }) {
    const friendship = await this.friendRepository.getFriendship({
      userIdA: targetUserId,
      userIdB: otherUserId,
    });

    if (friendship === undefined) {
      throw new DomainError(
        ErrorCode.FRIENDSHIP_NOT_FOUND,
        `Friendship between "${targetUserId}" and "${otherUserId}" not found`,
      );
    }

    return await this.friendRepository.removeFriend({
      userIdA: targetUserId,
      userIdB: otherUserId,
    });
  }

  public async countFriendRequests({ userId }: { userId: string }) {
    const count = await this.friendRepository.countFriendRequests({ userId });
    if (count === undefined) {
      throw new DomainError(ErrorCode.FAILED_TO_COUNT_FRIEND_REQUESTS);
    }
    return count;
  }

  public async determineFriendState({
    userId,
    targetUserId,
  }: {
    userId: string;
    targetUserId: string;
  }) {
    const friendshipExists = await this.friendshipExists({
      userIdA: userId,
      userIdB: targetUserId,
    });
    const friendRequest = await this.getFriendRequest({
      senderId: userId,
      recipientId: targetUserId,
    });

    if (friendshipExists) {
      return sharedValidators.user.FriendState.Enum.Friends;
    } else if (friendRequest) {
      return sharedValidators.user.FriendState.Enum.OutboundRequest;
    } else {
      return sharedValidators.user.FriendState.Enum.NotFriends;
    }
  }

  // async friendshipExists(userId1: string, userId2: string) {
  async friendshipExists({
    userIdA,
    userIdB,
  }: {
    userIdA: string;
    userIdB: string;
  }) {
    const friendshipExists = await this.friendRepository.getFriendship({
      userIdA,
      userIdB,
    });
    const reverseFriendshipExists = await this.friendRepository.getFriendship({
      userIdA,
      userIdB,
    });
    return !!friendshipExists || !!reverseFriendshipExists;
  }
}
