import { DomainError, ErrorCode } from "../../errors";
import { NotificationsRepository } from "../../repositories/user/notifications";
import type { NotificationSettings } from "../../repositories/user/notifications";
import { UserRepository } from "../../repositories/user/user";
import { UserService } from "./user";

export class NotificationsService {
  private userRepository = new UserRepository();
  private notificationsRepository = new NotificationsRepository();

  private userService = new UserService();

  async getNotificationSettings(userId: string) {
    const user = await this.userService.getUser(userId);

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
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
    const user = await this.userService.getUser(userId);

    const notificationSettings =
      await this.notificationsRepository.getNotificationSettings(
        user.notificationSettingsId,
      );

    if (notificationSettings === undefined) {
      throw new DomainError(ErrorCode.NOTIFICATION_SETTINGS_NOT_FOUND);
    }
    await this.notificationsRepository.updateNotificationSettings(
      user.notificationSettingsId,
      newNotificationSettings,
    );
  }

  async getPushToken(userId: string) {
    const pushToken = await this.notificationsRepository.getPushToken(userId);

    if (pushToken === undefined) {
      throw new DomainError(ErrorCode.PUSH_TOKEN_NOT_FOUND);
    }

    return pushToken;
  }

  async storePushToken(userId: string, pushToken: string) {
    await this.notificationsRepository.updatePushToken(userId, pushToken);
  }
}
