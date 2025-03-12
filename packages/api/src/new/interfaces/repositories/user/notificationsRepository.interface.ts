import type { z } from "zod";

import type { entityTypeEnum, Transaction } from "@oppfy/db";
import type { sharedValidators } from "@oppfy/validators";

export type EventType = z.infer<
  typeof sharedValidators.notifications.eventType
>;

export type StoreNotificationData = z.infer<
  typeof sharedValidators.notifications.notificationData
>;

export type SendNotificationData = z.infer<
  typeof sharedValidators.notifications.sendNotificationData
>;

export type SnsNotificationData = z.infer<
  typeof sharedValidators.notifications.snsNotificationData
>;

export type NotificationSettings = z.infer<
  typeof sharedValidators.notifications.updateNotificationSettings
>;

export type EntityType = (typeof entityTypeEnum.enumValues)[number];

export interface StorePushTokenParams {
  userId: string;
  pushToken: string;
}

export interface DeletePushTokenParams {
  userId: string;
  pushToken: string;
}

export interface GetNotificationSettingsParams {
  notificationSettingsId: string;
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
  notificationSettingsId: string;
  notificationSettings: NotificationSettings;
}

export interface StoreNotificationParams {
  senderId: string;
  recipientId: string;
  notificationData: StoreNotificationData;
}

export interface GetPushTokensParams {
  userId: string;
}

export interface DeleteNotificationByIdParams {
  id: string;
}

export interface DeleteNotificationsParams {
  senderId?: string;
  recipientId?: string;
  eventType?: EventType | EventType[];
  entityType?: EntityType;
  entityId?: string;
}

export interface DeleteNotificationsBetweenUsersParams {
  userIdA: string;
  userIdB: string;
}

export interface NotificationResult {
  id: string;
  senderId: string;
  recipientId: string;
  eventType: EventType;
  entityId: string | null;
  entityType: EntityType | null;
  read: boolean;
  createdAt: Date;
  senderUsername?: string;
  senderName?: string | null;
  senderProfilePictureUrl?: string | null;
  postImageUrl?: string | null;
}

export interface INotificationsRepository {
  storePushToken(params: StorePushTokenParams, tx?: Transaction): Promise<void>;

  deletePushToken(
    params: DeletePushTokenParams,
    tx?: Transaction,
  ): Promise<void>;

  getNotificationSettings(
    params: GetNotificationSettingsParams,
    tx?: Transaction,
  ): Promise<NotificationSettings | undefined>;

  getUnreadNotificationsCount(
    params: GetUnreadNotificationsCountParams,
    tx?: Transaction,
  ): Promise<number>;

  getRecentNotifications(
    params: GetRecentNotificationsParams,
    tx?: Transaction,
  ): Promise<NotificationResult[]>;

  paginateNotifications(
    params: PaginateNotificationsParams,
    tx?: Transaction,
  ): Promise<NotificationResult[]>;

  updateNotificationSettings(
    params: UpdateNotificationSettingsParams,
    tx?: Transaction,
  ): Promise<void>;

  storeNotification(
    params: StoreNotificationParams,
    tx?: Transaction,
  ): Promise<void>;

  getPushTokens(
    params: GetPushTokensParams,
    tx?: Transaction,
  ): Promise<string[]>;

  deleteNotificationById(
    params: DeleteNotificationByIdParams,
    tx?: Transaction,
  ): Promise<void>;

  deleteNotifications(
    params: DeleteNotificationsParams,
    tx?: Transaction,
  ): Promise<void>;

  deleteNotificationsBetweenUsers(
    params: DeleteNotificationsBetweenUsersParams,
    tx?: Transaction,
  ): Promise<void>;
}
