import { sharedValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FollowRepository } from "../../repositories";
import { FriendRepository } from "../../repositories/network/friend";
import { ProfileRepository } from "../../repositories/user/profile";
import { NotificationsService } from "../user/notifications";
import { UserService } from "../user/user";

export class FriendService {
  private friendRepository = new FriendRepository();
  private profileRepository = new ProfileRepository();
  private followRepository = new FollowRepository();

  private userService = new UserService();
  private notificationsService = new NotificationsService();

  async isFollowing(senderId: string, recipientId: string) {
    if (senderId === recipientId) return true; // Temporary fix
    return !!(await this.followRepository.getFollower(senderId, recipientId));
  }

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

    const isFollowing = await this.isFollowing(senderId, recipientId);

    const sender = await this.userService.getUser(senderId);
    const recipient = await this.userService.getUser(recipientId);

    if (!isFollowing) {
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
      } else {
        await this.followRepository.createFollower(senderId, recipientId);
      }
    }

    await this.friendRepository.createFriendRequest(senderId, recipientId);

    const profile = await this.profileRepository.getProfile(sender.profileId);

    if (profile === undefined) {
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        `Profile not found for user ID "${senderId}"`,
      );
    }

    const { friendRequests } =
      await this.notificationsService.getNotificationSettings(recipientId);

    if (friendRequests) {
      await this.notificationsService.sendNotification(senderId, recipientId, {
        title: "Friend Request",
        body: `${profile.username} has sent you a friend request`,

        entityType: "profile",
        entityId: sender.id,
      });
    }
  }

  async acceptFriendRequest(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new DomainError(ErrorCode.CANNOT_FRIEND_SELF);
    }

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

    // Determine user1 and user2 based on UUID comparison
    const [user1, user2] = senderId > recipientId
      ? [senderId, recipientId]
      : [recipientId, senderId];

    await this.friendRepository.createFriend(user1, user2);

    const senderFollowRequestToRecipient =
      await this.followRepository.getFollowRequest(senderId, recipientId);

    const recipientFollowRequestToSender =
      await this.followRepository.getFollowRequest(recipientId, senderId);

    if (senderFollowRequestToRecipient) {
      await this.followRepository.removeFollowRequest(senderId, recipientId);
    }

    if (recipientFollowRequestToSender) {
      await this.followRepository.removeFollowRequest(recipientId, senderId);
    }

    const senderFollowsRecipient = await this.followRepository.getFollower(
      senderId,
      recipientId,
    );
    const recipientFollowsSender = await this.followRepository.getFollower(
      recipientId,
      senderId,
    );

    if (!senderFollowsRecipient) {
      await this.followRepository.createFollower(senderId, recipientId);
    }

    if (!recipientFollowsSender) {
      await this.followRepository.createFollower(recipientId, senderId);

      // Send follow notification
      const sender = await this.userService.getUser(senderId);
      const senderProfile = await this.profileRepository.getProfile(
        sender.profileId,
      );

      if (senderProfile) {
        await this.notificationsService.storeNotification(
          recipientId,
          senderId,
          {
            eventType: "follow",
            entityType: "profile",
            entityId: recipientId,
          },
        );

        const { followRequests } =
          await this.notificationsService.getNotificationSettings(senderId);

        if (followRequests) {
          await this.notificationsService.sendNotification(
            recipientId,
            senderId,
            {
              title: "New follower",
              body: `${recipientProfile.username} is now following you.`,
              entityType: "profile",
              entityId: recipientId,
            },
          );
        }
      }
    }

    // Update notification storing to use user1 and user2
    await this.notificationsService.storeNotification(user2, user1, {
      eventType: "friend",
      entityType: "profile",
      entityId: recipient.id,
    });

    await this.notificationsService.storeNotification(user1, user2, {
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

    await this.friendRepository.deleteFriendRequest(senderId, recipientId);
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

    return await this.friendRepository.deleteFriendRequest(
      senderId,
      recipientId,
    );
  }

  async getFriendRequest(userId: string, targetUserId: string) {
    return await this.friendRepository.getFriendRequest(userId, targetUserId);
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

    return await this.friendRepository.removeFriend(targetUserId, otherUserId);
  }

  public async countFriendRequests(userId: string) {
    return await this.friendRepository.countFriendRequests(userId);
  }

  public async determineFriendState(userId: string, targetUserId: string) {
    const friendshipExists = await this.friendshipExists(userId, targetUserId);
    const friendRequest = await this.getFriendRequest(userId, targetUserId);

    if (friendshipExists) {
      return sharedValidators.user.FriendState.Enum.Friends;
    } else if (friendRequest) {
      return sharedValidators.user.FriendState.Enum.OutboundRequest;
    } else {
      return sharedValidators.user.FriendState.Enum.NotFriends;
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
