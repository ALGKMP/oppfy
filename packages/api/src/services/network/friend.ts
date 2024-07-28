import { FriendState } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FriendRepository } from "../../repositories/network/friend";
import { ProfileRepository } from "../../repositories/profile/profile";
import { NotificationsService } from "../user/notifications";
import { UserService } from "../user/user";

export class FriendService {
  private friendRepository = new FriendRepository();
  private profileRepository = new ProfileRepository();

  private userService = new UserService();
  private notificationsService = new NotificationsService();

  async sendFriendRequest(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FRIEND_SELF);
    }

    const friendshipExists = await this.friendshipExists(senderId, recipientId);

    if (friendshipExists) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FRIENDS,
        `Users "${senderId}" and "${recipientId}" are already friends`,
      );
    }

    const friendRequest = await this.getFriendRequest(senderId, recipientId);

    if (friendRequest) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_ALREADY_SENT,
        `Friend request already sent from "${senderId}" to "${recipientId}"`,
      );
    }

    await this.friendRepository.createFriendRequest(senderId, recipientId);

    const sender = await this.userService.getUser(senderId);
    const profile = await this.profileRepository.getProfile(sender.profileId);

    if (profile === undefined) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        `Profile not found for user ID "${senderId}"`,
      );
    }

    await this.notificationsService.storeNotification(senderId, recipientId, {
      eventType: "friendRequest",
      entityType: "profile",
      entityId: sender.id,
    });

    const { friendRequests } =
      await this.notificationsService.getNotificationSettings(recipientId);

    if (!friendRequests) {
      return;
    }

    await this.notificationsService.sendNotification(senderId, recipientId, {
      title: "Friend Request",
      body: `${profile.username} has sent you a friend request`,

      entityType: "profile",
      entityId: sender.id,
    });
  }

  async acceptFriendRequest(senderId: string, recipientId: string) {
    const friendRequest = await this.friendRepository.getFriendRequest(
      senderId,
      recipientId,
    );

    if (friendRequest === undefined) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        `Friend request from "${senderId}" to "${recipientId}" not found`,
      );
    }

    await this.friendRepository.createFriend(senderId, recipientId);

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

    await this.notificationsService.deleteNotification(
      senderId,
      "friendRequest",
    );
    await this.notificationsService.storeNotification(recipientId, senderId, {
      eventType: "friend",
      entityType: "profile",
      entityId: recipient.id,
    });

    await this.notificationsService.storeNotification(senderId, recipientId, {
      eventType: "friend",
      entityType: "profile",
      entityId: recipient.id,
    });

    const { friendRequests } =
      await this.notificationsService.getNotificationSettings(senderId);

    if (friendRequests) {
      await this.notificationsService.sendNotification(recipientId, senderId, {
        title: "Friend Request Accepted",
        body: `${recipientProfile.username} has accepted your friend request`,
        entityType: "profile",
        entityId: recipient.id,
      });
    }
  }

  async declineFriendRequest(senderId: string, recipientId: string) {
    const friendRequest = await this.friendRepository.getFriendRequest(
      senderId,
      recipientId,
    );

    if (friendRequest === undefined) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        `Friend request from "${senderId}" to "${recipientId}" not found`,
      );
    }

    await this.friendRepository.cancelFriendRequest(senderId, recipientId);
    await this.notificationsService.deleteNotification(
      senderId,
      "friendRequest",
    );
  }

  async cancelFriendRequest(senderId: string, recipientId: string) {
    const friendRequest = await this.friendRepository.getFriendRequest(
      senderId,
      recipientId,
    );
    if (friendRequest === undefined) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        `Friend request from "${senderId}" to "${recipientId}" not found`,
      );
    }

    // handlen notis
    await this.notificationsService.deleteNotification(
      senderId,
      "friendRequest",
    );

    return await this.friendRepository.cancelFriendRequest(
      senderId,
      recipientId,
    );
  }

  async getFriendRequest(userId: string, targetUserId: string) {
    const friendRequests = await this.friendRepository.getFriendRequest(
      userId,
      targetUserId,
    );
    if (!friendRequests) {
      console.log(
        `No friend request found between ${userId} and ${targetUserId}`,
      );
    }
    return friendRequests;
  }

  async removeFriend(targetUserId: string, otherUserId: string) {
    const friendship = await this.friendRepository.getFriendship(
      targetUserId,
      otherUserId,
    );

    if (friendship === undefined) {
      throw new DomainError(
        ErrorCode.FRIENDSHIP_NOT_FOUND,
        `Friendship between "${targetUserId}" and "${otherUserId}" not found`,
      );
    }

    await this.notificationsService.deleteNotification(targetUserId, "friend");
    await this.notificationsService.deleteNotification(otherUserId, "friend");
    return await this.friendRepository.removeFriend(targetUserId, otherUserId);
  }

  public async countFriendRequests(userId: string) {
    return await this.friendRepository.countFriendRequests(userId);
  }

  public async determineFriendState(userId: string, targetUserId: string) {
    const friendshipExists = await this.friendshipExists(userId, targetUserId);
    const friendRequest = await this.getFriendRequest(userId, targetUserId);
    const incomingRequest = await this.getFriendRequest(targetUserId, userId);

    if (friendshipExists) {
      return FriendState.Enum.Friends;
    } else if (friendRequest) {
      return FriendState.Enum.OutboundRequest;
    } else if (incomingRequest) {
      return FriendState.Enum.IncomingRequest;
    } else {
      return FriendState.Enum.NotFriends;
    }
  }

  async friendshipExists(userId1: string, userId2: string) {
    const friendshipExists = await this.friendRepository.getFriendship(
      userId1,
      userId2,
    );
    const reverseFriendshipExists = await this.friendRepository.getFriendship(
      userId2,
      userId1,
    );
    return !!friendshipExists || !!reverseFriendshipExists;
  }
}
