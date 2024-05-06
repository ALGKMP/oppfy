import { DomainError, ErrorCodes } from "../errors";
import { FollowerRepository } from "../repositories/follower";
import { FriendRepository } from "../repositories/friend";
import type { NotificationSettings } from "../repositories/notificationSettings";
import { NotificationSettingsRepository } from "../repositories/notificationSettings";
import type { PrivacySetting } from "../repositories/user";
import { UserRepository } from "../repositories/user";

export class UserService {
  private userRepository = new UserRepository();
  private notificationSettingsRepository = new NotificationSettingsRepository();
  private followRepository = new FollowerRepository();
  private friendRepository = new FriendRepository

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    return user;
  }

  async createUser(userId: string) {
    const userExists = await this._userExists(userId);

    if (userExists) {
      throw new DomainError(ErrorCodes.USER_ALREADY_EXISTS);
    }

    await this.userRepository.createUser(userId);
  }

  async deleteUser(userId: string) {
    const userExists = await this._userExists(userId);

    if (!userExists) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    await this.userRepository.deleteUser(userId);
  }

  async updateUsername(userId: string, newUsername: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    if (user.username === newUsername) {
      return;
    }

    const usernameExists =
      await this.userRepository.usernameExists(newUsername);

    if (usernameExists) {
      throw new DomainError(ErrorCodes.USERNAME_ALREADY_EXISTS);
    }

    await this.userRepository.updateUsername(userId, newUsername);
  }

  async userOnboardingCompleted(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const profile = await this.userRepository.getProfile(user.profileId);

    if (profile === undefined) {
      throw new DomainError(ErrorCodes.PROFILE_NOT_FOUND);
    }

    return !!profile.dateOfBirth && !!profile.fullName && !!user.username;
  }

  async updatePrivacySetting(
    userId: string,
    newPrivacySetting: PrivacySetting,
  ) {
    const userExists = await this._userExists(userId);

    if (!userExists) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    await this.userRepository.updatePrivacySetting(userId, newPrivacySetting);
  }

  async getUserNotificationSettings(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const notificationSettings =
      await this.notificationSettingsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCodes.NOTIFICATION_SETTINGS_NOT_FOUND);
    }

    return notificationSettings;
  }

  async updateNotificationSettings(
    userId: string,
    newNotificationSettings: NotificationSettings,
  ) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }

    const notificationSettings =
      await this.notificationSettingsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCodes.NOTIFICATION_SETTINGS_NOT_FOUND);
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
    const cursor = userId
    return await this.userRepository.getPaginatedFollowers(cursor);
  }

  async getFriends(userId: string) {
    const cursor = userId 
    return await this.userRepository.getPaginatedFriends(cursor);
  }

  async isFriends(userId1: string, userId2: string) {
    return !!(await this.friendRepository.getFriend(userId1, userId2));
  }

  async getFriendRequests(userId: string) {
    return await this.userRepository.getPaginatedFriendRequests(userId);
  }

  async getFollowing(userId: string) {
    const cursor = userId
    return await this.userRepository.getPaginatedFollowing(cursor);
  }

  async isFollowing(followerId: string, followedId: string) {
    return !!(await this.followRepository.getFollower(followerId, followedId))
  }

  async getFollowRequests(userId: string) {
    return await this.userRepository.getPaginatedFollowRequests(userId);
  };

  async blockUser(userId: string, blockUserId: string) {
    if (await this.isFollowing(userId, blockUserId)) {
      const a = await this.followRepository.removeFollower(userId, blockUserId);
      if (!a) { // giving up on variable names
        throw new DomainError(ErrorCodes.FAILED_TO_REMOVE_FOLLOWER);
      };
    };

    if (await this.isFollowing(blockUserId, userId)) {
      const b = await this.followRepository.removeFollower(blockUserId, userId);
      if (!b) {
        throw new DomainError(ErrorCodes.FAILED_TO_REMOVE_FOLLOWER);
      };
    };

    if (await this.isFriends(userId, blockUserId)) { 
      const c = await this.friendRepository.removeFriend(userId, blockUserId);
      if (!c) {
        throw new DomainError(ErrorCodes.FAILED_TO_REMOVE_FRIEND);
      };
    };

    const result = await this.userRepository.blockUser(userId, blockUserId);
    if (!result) {
      throw new DomainError(ErrorCodes.FAILED_TO_BLOCK_USER);
    }
  }

  async isUserBlocked(userId: string, blockedUserId: string) {
    return !!(await this.userRepository.getBlockedUser(userId, blockedUserId));
  }

  async unblockUser(userId:string, blockedUserId: string) {
    const result = await this.userRepository.unblockUser(userId, blockedUserId);
    // TODO: There should be a delete marker, not sure why I'm not getting it with autocomplete!?!?!?
    if (!result[0]) {
      throw new DomainError(ErrorCodes.FAILED_TO_UNBLOCK_USER);
    }
  }

  async followUser(followerId:string, followedId: string) {
    const alreadyFollowing = await this.isFollowing(followerId, followedId);
    if (alreadyFollowing) {
      throw new DomainError(ErrorCodes.USER_ALREADY_FOLLOWED);
    }

    const user = await this.userRepository.getUser(followedId);
    if (user === undefined) {
      throw new DomainError(ErrorCodes.USER_NOT_FOUND);
    }
    
    if (user.privacySetting === "private") {
      const result = await this.followRepository.requestFollow(followerId, followedId);
      if (!result[0]) {
        throw new DomainError(ErrorCodes.FAILED_TO_REQUEST_FOLLOW);
      }
    }

    const result = await this.followRepository.addFollower(followerId, followedId);
    if (!result[0]) {
      throw new DomainError(ErrorCodes.FAILED_TO_FOLLOW_USER);
    }
  }

}
