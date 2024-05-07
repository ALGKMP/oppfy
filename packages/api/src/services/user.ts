import { DomainError, ErrorCode } from "../errors";
import { FollowRepository } from "../repositories/follow";
import { FriendRepository } from "../repositories/friend";
import type { NotificationSettings } from "../repositories/notificationSettings";
import { NotificationSettingsRepository } from "../repositories/notificationSettings";
import type { PrivacySetting } from "../repositories/user";
import { UserRepository } from "../repositories/user";
import { AwsService } from "./aws";

export class UserService {
  private userRepository = new UserRepository();
  private notificationSettingsRepository = new NotificationSettingsRepository();
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private awsService = new AwsService();

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    return user;
  }

  async createUser(userId: string) {
    const userExists = await this._userExists(userId);

    if (userExists) {
      throw new DomainError(ErrorCode.USER_ALREADY_EXISTS);
    }

    await this.userRepository.createUser(userId);
  }

  async deleteUser(userId: string) {
    const userExists = await this._userExists(userId);

    if (!userExists) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    await this.userRepository.deleteUser(userId);
  }

  async updateUsername(userId: string, newUsername: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    if (user.username === newUsername) {
      return;
    }

    const usernameExists =
      await this.userRepository.usernameExists(newUsername);

    if (usernameExists) {
      throw new DomainError(ErrorCode.USERNAME_ALREADY_EXISTS);
    }

    await this.userRepository.updateUsername(userId, newUsername);
  }

  async userOnboardingCompleted(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const profile = await this.userRepository.getProfile(user.profileId);

    if (profile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND);
    }

    return !!profile.dateOfBirth && !!profile.fullName && !!user.username;
  }

  async getUserPrivacySetting(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    return user.privacySetting;
  }

  async updatePrivacySetting(
    userId: string,
    newPrivacySetting: PrivacySetting,
  ) {
    const userExists = await this._userExists(userId);

    if (!userExists) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const updatedPrivacy = await this.userRepository.updatePrivacySetting(
      userId,
      newPrivacySetting,
    );
    if (!updatedPrivacy) {
      throw new DomainError(ErrorCode.FAILED_TO_UPDATE_PRIVACY_SETTING);
    }
  }

  async getUserNotificationSettings(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const notificationSettings =
      await this.notificationSettingsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }

    return notificationSettings;
  }

  async updateNotificationSettings(
    userId: string,
    newNotificationSettings: NotificationSettings,
  ) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    const notificationSettings =
      await this.notificationSettingsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }

    await this.notificationSettingsRepository.updateNotificationSettings(
      notificationSettings.id,
      newNotificationSettings,
    );
  }

  private async _userExists(userId: string) {
    const user = await this.userRepository.getUser(userId);
    return user !== undefined;
  }

  async getFollowers(userId: string) {
    const cursor = userId;
    return await this.userRepository.getPaginatedFollowers(cursor);
  }

  async getFriends(userId: string) {
    const cursor = userId;
    return await this.userRepository.getPaginatedFriends(cursor);
  }

  async isFriends(userId1: string, userId2: string) {
    return !!(await this.friendRepository.getFriend(userId1, userId2));
  }

  async getFriendRequests(userId: string) {
    return await this.userRepository.getPaginatedFriendRequests(userId);
  }

  async getFollowing(userId: string) {
    const cursor = userId;
    return await this.userRepository.getPaginatedFollowing(cursor);
  }

  async isFollowing(followerId: string, followedId: string) {
    return !!(await this.followRepository.getFollower(followerId, followedId));
  }

  async getFollowRequests(userId: string) {
    return await this.userRepository.getPaginatedFollowRequests(userId);
  }

  async getBlockedUsers(
    userId: string,
    cursor: string | null = null,
    pageSize = 10,
  ) {
    const data = await this.userRepository.getPaginatedBlockedUsers(
      userId,
      cursor,
      pageSize,
    );
    // Update each item's profilePictureUrl with a presigned URL
    const items = await Promise.all(
      data.map(async (item) => {
        if (item.profilePictureUrl) {
          const presignedUrl = await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: item.profilePictureUrl,
          });
          item.profilePictureUrl = presignedUrl;
        }
        if (!item.profilePictureUrl) {
          const presignedUrl = await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: "profilePictures/default.jpg",
          });
          item.profilePictureUrl = presignedUrl;
        }
        return item;
      }),
    );

    let nextCursor: typeof cursor | undefined = undefined;
    if (items.length > pageSize) {
      const nextItem = items.pop();
      nextCursor = nextItem!.userId;
    }
    return {
      items,
      nextCursor,
    };
  }

  async blockUser(userId: string, blockUserId: string) {
    if (await this.isFollowing(userId, blockUserId)) {
      const a = await this.followRepository.removeFollower(userId, blockUserId);
      if (!a) {
        // giving up on variable names
        throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOWER);
      }
    }

    if (await this.isFollowing(blockUserId, userId)) {
      const b = await this.followRepository.removeFollower(blockUserId, userId);
      if (!b) {
        throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOWER);
      }
    }

    if (await this.isFriends(userId, blockUserId)) {
      const c = await this.friendRepository.removeFriend(userId, blockUserId);
      if (!c) {
        throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FRIEND);
      }
    }

    const result = await this.userRepository.blockUser(userId, blockUserId);
    if (!result) {
      throw new DomainError(ErrorCode.FAILED_TO_BLOCK_USER);
    }
  }

  async isUserBlocked(userId: string, blockedUserId: string) {
    return !!(await this.userRepository.getBlockedUser(userId, blockedUserId));
  }

  async unblockUser(userId: string, blockedUserId: string) {
    const result = await this.userRepository.unblockUser(userId, blockedUserId);
    // TODO: There should be a delete marker, not sure why I'm not getting it with autocomplete!?!?!?
    if (!result) {
      throw new DomainError(ErrorCode.FAILED_TO_UNBLOCK_USER);
    }
  }

  async followUser(senderId: string, recipientId: string) {
    const alreadyFollowing = await this.isFollowing(senderId, recipientId);
    if (alreadyFollowing) {
      throw new DomainError(ErrorCode.USER_ALREADY_FOLLOWED);
    }

    const user = await this.userRepository.getUser(recipientId);
    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    if (user.privacySetting === "private") {
      const result = await this.followRepository.createFollowRequest(
        senderId,
        recipientId,
      );
      if (!result) {
        throw new DomainError(ErrorCode.FAILED_TO_REQUEST_FOLLOW);
      }
    }

    const result = await this.followRepository.addFollower(
      senderId,
      recipientId,
    );
    if (!result) {
      throw new DomainError(ErrorCode.FAILED_TO_FOLLOW_USER);
    }
  }

  async unfollowUser(senderId: string, recipientId: string) {
    const result = await this.followRepository.removeFollower(
      senderId,
      recipientId,
    );
    if (!result.insertId) {
      throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOWER);
    }
  }

  async acceptFollowRequest(senderId: string, recipientId: string) {
    const result = await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
    if (!result.insertId) {
      throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOW_REQUEST);
    }

    const result2 = await this.followRepository.addFollower(
      senderId,
      recipientId,
    );
    if (!result2) {
      throw new DomainError(ErrorCode.FAILED_TO_FOLLOW_USER);
    }
  }

  async rejectFollowRequest(senderId: string, recipientId: string) {
    const result = await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
    if (!result.insertId) {
      throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOW_REQUEST);
    }
  }

  async sendFriendRequest(senderId: string, recipientId: string) {
    const alreadyFriends = await this.isFriends(senderId, recipientId);
    if (alreadyFriends) {
      throw new DomainError(ErrorCode.USER_ALREADY_FRIENDS);
    }

    const result = await this.friendRepository.createFriendRequest(
      senderId,
      recipientId,
    );
    if (!result) {
      throw new DomainError(ErrorCode.FAILED_TO_REQUEST_FOLLOW);
    }
  }

  async acceptFriendRequest(requesterId: string, requestedId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!requestExists) {
      throw new DomainError(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }

    await this.friendRepository.deleteFriendRequest(requesterId, requestedId);
    const addFriendResult = await this.friendRepository.addFriend(
      requesterId,
      requestedId,
    );
    if (!addFriendResult) {
      throw new DomainError(ErrorCode.FAILED_TO_ADD_FRIEND);
    }
  }

  async rejectFriendRequest(requesterId: string, requestedId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!requestExists) {
      throw new DomainError(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }

    const deleteResult = await this.friendRepository.deleteFriendRequest(
      requesterId,
      requestedId,
    );
    if (!deleteResult) {
      throw new DomainError(ErrorCode.FAILED_TO_DELETE_FRIEND_REQUEST);
    }
  }

  async removeFriend(userId1: string, userId2: string) {
    const friendshipExists = await this.friendRepository.getFriend(
      userId1,
      userId2,
    );
    if (!friendshipExists) {
      throw new DomainError(ErrorCode.FRIENDSHIP_NOT_FOUND);
    }

    const removeResult = await this.friendRepository.removeFriend(
      userId1,
      userId2,
    );
    if (!removeResult) {
      throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FRIEND);
    }
  }

  async removeFollower(followerId: string, followedId: string) {
    const followerExists = await this.followRepository.getFollower(
      followerId,
      followedId,
    );
    if (!followerExists) {
      throw new DomainError(ErrorCode.FOLLOW_NOT_FOUND);
    }

    const removeResult = await this.followRepository.removeFollower(
      followerId,
      followedId,
    );
    if (!removeResult) {
      throw new DomainError(ErrorCode.FAILED_TO_REMOVE_FOLLOWER);
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

  async cancelFriendRequest(requesterId: string, requestedId: string) {
    const friendRequestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!friendRequestExists) {
      throw new DomainError(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }

    const deleteResult = await this.friendRepository.deleteFriendRequest(
      requesterId,
      requestedId,
    );
    if (!deleteResult) {
      throw new DomainError(ErrorCode.FAILED_TO_CANCEL_FRIEND_REQUEST);
    }
  }
}
