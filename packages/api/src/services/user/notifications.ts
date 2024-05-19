import { DomainError, ErrorCode } from "../../errors";
import { NotificationSettingsRepository } from "../../repositories/user/notification-settings";
import type { NotificationSettings } from "../../repositories/user/notification-settings";
import { UserRepository } from "../../repositories/user/user";

export class NotificationService {
  private userRepository = new UserRepository();
  private notificationSettingsRepository = new NotificationSettingsRepository();

  async getUserNotificationSettings(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
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
    if (!user) {
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
}
