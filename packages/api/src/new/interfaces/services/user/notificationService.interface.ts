import type { EntityType, EventType, NotificationSettings } from "@oppfy/db";

export interface GetNotificationSettingsParams {
  userId: string;
}

export interface GetUnreadNotificationsCountParams {
  userId: string;
}

export interface GetRecentNotificationsParams {
  senderId?: string;
  recipientId?: string;
  eventType?: EventType;
  entityId?: string;
  entityType?: EntityType;
  minutesThreshold: number;
  limit: number;
}

export interface PaginateNotificationsParams {
  userId: string;
  cursor?: { createdAt: Date; id: string } | null;
  pageSize?: number;
}

export interface UpdateNotificationSettingsParams {
  userId: string;
  newNotificationSettings: NotificationSettings;
}

export interface StorePushTokenParams {
  userId: string;
  pushToken: string;
}

export interface DeletePushTokenParams {
  userId: string;
  pushToken: string;
}

export interface INotificationService {
  getNotificationSettings(
    params: GetNotificationSettingsParams,
  ): Promise<NotificationSettings>;

  getUnreadNotificationsCount(
    params: GetUnreadNotificationsCountParams,
  ): Promise<number>;

  getRecentNotifications(params: GetRecentNotificationsParams): Promise<
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

  paginateNotifications(params: PaginateNotificationsParams): Promise<{
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

  updateNotificationSettings(
    params: UpdateNotificationSettingsParams,
  ): Promise<void>;

  storePushToken(params: StorePushTokenParams): Promise<void>;

  deletePushToken(params: DeletePushTokenParams): Promise<void>;
}
