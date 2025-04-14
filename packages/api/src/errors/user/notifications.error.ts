import { createBaseErrorClass } from "../errorFactory";

const NotificationError = createBaseErrorClass("Notification");

export class NotificationSettingsNotFound extends NotificationError {
  name = "NotificationSettingsNotFoundError" as const;
  constructor(userId: string) {
    super(`Notification settings not found for user ${userId}`);
  }
}
