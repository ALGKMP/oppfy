import { DomainError, ErrorCode } from "../errors";
import { FollowRepository } from "../repositories/follow";
import { FriendRepository } from "../repositories/friend";
import type { NotificationSettings } from "../repositories/notification-settings";
import { NotificationSettingsRepository } from "../repositories/notification-settings";
import type { PrivacySetting } from "../repositories/user";
import { UserRepository } from "../repositories/user";
import { AwsService } from "./aws";

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Cursor | undefined;
}

interface Cursor {
  createdAt: Date;
  profileId: number;
}

export interface UserProfile {
  userId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string;
  createdAt: Date;
  profileId: number;
}

export class UserService {
  private userRepository = new UserRepository();
  private notificationSettingsRepository = new NotificationSettingsRepository();
  private followRepository = new FollowRepository();
  private friendRepository = new FriendRepository();
  private awsService = new AwsService();

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return user;
  }

  async createUser(userId: string) {
    const userExists = await this._userExists(userId);

    if (userExists) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_EXISTS,
        "User already exists",
      );
    }

    return await this.userRepository.createUser(userId);
  }

  async deleteUser(userId: string) {
    const userExists = await this._userExists(userId);

    if (!userExists) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.userRepository.deleteUser(userId);
  }

  async checkOnboardingComplete(userId: string) {
    const user = await this.userRepository.getUserProfile(userId);

    if (user?.profile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND, "Profile not found");
    }

    return (
      !!user.profile.dateOfBirth &&
      !!user.profile.fullName &&
      !!user.profile.username
    );
  }

  async getPrivacySettings(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return user.privacySetting;
  }

  async updatePrivacySettings(
    userId: string,
    newPrivacySetting: PrivacySetting,
  ) {
    const exists = await this._userExists(userId);

    if (!exists) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const updatedPrivacy = await this.userRepository.updatePrivacySetting(
      userId,
      newPrivacySetting,
    );
    if (!updatedPrivacy) {
      throw new DomainError(
        ErrorCode.FAILED_TO_UPDATE_PRIVACY_SETTING,
        "Failed to update privacy settings",
      );
    }
  }

  async getUserNotificationSettings(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const notificationSettings =
      await this.notificationSettingsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(
        ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND,
        "Notification settings not found",
      );
    }

    return notificationSettings;
  }

  async updateNotificationSettings(
    userId: string,
    newNotificationSettings: NotificationSettings,
  ) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    const notificationSettings =
      await this.notificationSettingsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(
        ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND,
        "Notification settings not found",
      );
    }

    await this.notificationSettingsRepository.updateNotificationSettings(
      user.notificationSettingsId,
      newNotificationSettings,
    );
  }

  async isFriends(userId1: string, userId2: string) {
    return !!(await this.friendRepository.getFriend(userId1, userId2));
  }

  async isFollowing(userId: string, recipientId: string) {
    return !!(await this.followRepository.getFollower(userId, recipientId));
  }

  async getNetworkStatus(userId1: string, userId2: string) {
    const isFriends = await this.isFriends(userId1, userId2);
    const isFollowing = await this.isFollowing(userId1, userId2);
    const isFollowedBy = await this.isFollowing(userId2, userId1);
    const isBlocked = await this.isUserBlocked(userId1, userId2);

    return {
      isFriends,
      isFollowing,
      isFollowedBy,
      isBlocked,
    };
  }

  async paginateFollowers(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.userRepository.getPaginatedFollowers(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFriends(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.userRepository.getPaginatedFriends(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFollowing(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.userRepository.getPaginatedFollowing(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateBlocked(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.userRepository.getPaginatedBlockedUsers(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFriendRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.userRepository.getPaginatedFriendRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async paginateFollowRequests(
    userId: string,
    cursor: Cursor | null = null,
    pageSize = 10,
  ): Promise<PaginatedResponse<UserProfile>> {
    const data = await this.userRepository.getPaginatedFollowRequests(
      userId,
      cursor,
      pageSize,
    );
    return this._updateProfilePictureUrls(data, pageSize);
  }

  async blockUser(userId: string, userIdBeingBlocked: string) {
    const followingUserBeingBlocked = await this.isFollowing(
      userId,
      userIdBeingBlocked,
    );
    const followedByUserBeingBlocked = await this.isFollowing(
      userIdBeingBlocked,
      userId,
    );
    const isFriends = await this.isFriends(userId, userIdBeingBlocked);
    if (followingUserBeingBlocked) {
      const unfollow = await this.followRepository.removeFollower(
        userId,
        userIdBeingBlocked,
      );
      if (!unfollow) {
        // giving up on variable names
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FOLLOWER,
          "Failed to remove follower",
        );
      }
    }

    if (followedByUserBeingBlocked) {
      const removeFollower = await this.followRepository.removeFollower(
        userIdBeingBlocked,
        userId,
      );
      if (!removeFollower) {
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FOLLOWER,
          "Failed to remove follower",
        );
      }
    }

    if (isFriends) {
      const unfriend = await this.friendRepository.removeFriend(
        userId,
        userIdBeingBlocked,
      );
      if (!unfriend) {
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FRIEND,
          "Failed to remove friend",
        );
      }
    }

    const result = await this.userRepository.blockUser(
      userId,
      userIdBeingBlocked,
    );
    if (!result) {
      throw new DomainError(
        ErrorCode.FAILED_TO_BLOCK_USER,
        "Failed to block user",
      );
    }
  }

  async isUserBlocked(userId: string, blockedUserId: string) {
    const blockedUser = await this.userRepository.getBlockedUser(
      userId,
      blockedUserId,
    );
    if (!blockedUser) {
      throw new DomainError(
        ErrorCode.FAILED_TO_CHECK_RELATIONSHIP,
        "Failed to check relationship",
      );
    }
    return !!blockedUser;
  }

  async unblockUser(userId: string, blockedUserId: string) {
    const unblock = await this.userRepository.unblockUser(
      userId,
      blockedUserId,
    );
    if (!unblock) {
      throw new DomainError(
        ErrorCode.FAILED_TO_UNBLOCK_USER,
        "Failed to unblock user",
      );
    }
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
    if (!result.insertId) {
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
    if (!result.insertId) {
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
    if (!result.insertId) {
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FOLLOW_REQUEST,
        "Failed to remove follow request",
      );
    }
  }

  async sendFriendRequest(senderId: string, recipientId: string) {
    const alreadyFriends = await this.isFriends(senderId, recipientId);
    if (alreadyFriends) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FRIENDS,
        "User already friends",
      );
    }

    const result = await this.friendRepository.createFriendRequest(
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

  async acceptFriendRequest(requesterId: string, requestedId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!requestExists) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }
    await this.friendRepository.deleteFriendRequest(requesterId, requestedId);

    const addFriendResult = await this.friendRepository.addFriend(
      requesterId,
      requestedId,
    );
    if (!addFriendResult) {
      throw new DomainError(
        ErrorCode.FAILED_TO_ADD_FRIEND,
        "Failed to add friend",
      );
    }
  }

  async rejectFriendRequest(requesterId: string, requestedId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!requestExists) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    await this.friendRepository.deleteFriendRequest(requesterId, requestedId);
  }

  async removeFriend(userId1: string, userId2: string) {
    const friendshipExists = await this.friendRepository.getFriend(
      userId1,
      userId2,
    );
    const friendshipExists2 = await this.friendRepository.getFriend(
      userId2,
      userId1,
    );
    if (!friendshipExists && !friendshipExists2) {
      throw new DomainError(
        ErrorCode.FRIENDSHIP_NOT_FOUND,
        "Friendship not found",
      );
    }

    if (friendshipExists) {
      const removeResult = await this.friendRepository.removeFriend(
        userId1,
        userId2,
      );
      if (!removeResult) {
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FRIEND,
          "Failed to remove friend",
        );
      }
    } else {
      const removeResult = await this.friendRepository.removeFriend(
        userId2,
        userId1,
      );
      if (!removeResult) {
        throw new DomainError(
          ErrorCode.FAILED_TO_REMOVE_FRIEND,
          "Failed to remove friend",
        );
      }
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

  async cancelFollowRequest(senderId: string, recipientId: string) {
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

    const deleteResult = await this.followRepository.removeFollowRequest(
      senderId,
      recipientId,
    );
    if (!deleteResult) {
      throw new DomainError(
        ErrorCode.FAILED_TO_CANCEL_FOLLOW_REQUEST,
        "Failed to cancel follow request",
      );
    }
  }

  async cancelFriendRequest(requesterId: string, requestedId: string) {
    const friendRequestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!friendRequestExists) {
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    const deleteResult = await this.friendRepository.deleteFriendRequest(
      requesterId,
      requestedId,
    );
    if (!deleteResult) {
      throw new DomainError(
        ErrorCode.FAILED_TO_CANCEL_FRIEND_REQUEST,
        "Failed to cancel friend request",
      );
    }
  }

  private async _userExists(userId: string) {
    const user = await this.userRepository.getUser(userId);
    return user !== undefined;
  }

  private async _updateProfilePictureUrls(
    data: UserProfile[],
    pageSize: number,
  ): Promise<PaginatedResponse<UserProfile>> {
    try {
      if (data.length === 0) {
        return {
          items: [],
          nextCursor: undefined,
        };
      }
      const items = await Promise.all(
        data.map(async (item) => {
          const presignedUrl = await this.awsService.getObjectPresignedUrl({
            Bucket: process.env.S3_PROFILE_BUCKET!,
            Key: item.profilePictureUrl,
          });
          item.profilePictureUrl = presignedUrl;
          return item;
        }),
      );

      let nextCursor: Cursor | undefined = undefined;
      if (items.length > pageSize) {
        const nextItem = items.pop();
        nextCursor = {
          createdAt: nextItem!.createdAt,
          profileId: nextItem!.profileId,
        };
      }
      return {
        items,
        nextCursor,
      };
    } catch (err) {
      console.log(err);
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URLs",
      );
    }
  }
}
