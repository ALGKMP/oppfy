import type { EntityType, EventType, NotificationSettings } from "@oppfy/db";

export interface INotificationService {
  getNotificationSettings(options: {
    userId: string;
  }): Promise<NotificationSettings>;

  getUnreadNotificationsCount(options: { userId: string }): Promise<number>;

  getRecentNotifications(options: {
    senderId?: string;
    recipientId?: string;
    eventType?: EventType;
    entityId?: string;
    entityType?: EntityType;
    minutesThreshold: number;
    limit: number;
  }): Promise<
    {
      id: string;
      createdAt: Date;
      eventType: EventType;
      entityType: EntityType;
      entityId: string;
      senderId: string;
      recipientId: string;
      read: boolean;
      profilePictureKey: string | null;
    }[]
  >;

  paginateNotifications(options: {
    userId: string;
    cursor?: { createdAt: Date; id: string } | null;
    pageSize?: number;
  }): Promise<{
    items: {
      id: string;
      createdAt: Date;
      eventType: EventType;
      entityType: EntityType;
      entityId: string;
      senderId: string;
      recipientId: string;
      read: boolean;
      profilePictureUrl: string | null;
    }[];
    nextCursor: { createdAt: Date; id: string } | null;
  }>;

  updateNotificationSettings(options: {
    userId: string;
    newNotificationSettings: NotificationSettings;
  }): Promise<void>;

  storePushToken(options: { userId: string; pushToken: string }): Promise<void>;

  deletePushToken(options: {
    userId: string;
    pushToken: string;
  }): Promise<void>;
}
