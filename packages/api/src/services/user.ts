import { DomainError, ErrorCodes } from "../errors";
import type { NotificationSettings } from "../repositories/notificationSettings";
import { NotificationSettingsRepository } from "../repositories/notificationSettings";
import type { PrivacySetting } from "../repositories/user";
import { UserRepository } from "../repositories/user";

export class UserService {
  private userRepository = new UserRepository();
  private notificationSettingsRepository = new NotificationSettingsRepository();

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
    return this.userRepository.getPaginatedFollowers(cursor);
  }

  async getFriends(userId: string) {
    const cursor = userId 
    return this.userRepository.getPaginatedFriends(cursor);
  }

  async getFollowing(userId: string) {
    const cursor = userId
    return this.userRepository.getPaginatedFollowing(cursor);
  }

  async getFollowRequests(userId: string) {
    return this.userRepository.getPaginatedFollowRequests(userId);
  }

  async getFriendRequests(userId: string) {
    return this.userRepository.getPaginatedFriendRequests(userId);
  }
}
