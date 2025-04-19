import { and, count, desc, eq, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { z } from "zod";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
// export type NotificationType =
//   | "like"
//   | "comment"
//   | "follow"
//   | "friend"

// export type EntityType = "post" | "profile";

import { entityTypeEnum, eventTypeEnum } from "@oppfy/db";
import {
  FollowStatus,
  getFollowStatusSql,
  onboardingCompletedCondition,
} from "@oppfy/db/utils/query-helpers";
import { SQS } from "@oppfy/sqs";

import type { Notification, NotificationSettings, Profile } from "../../models";
import { TYPES } from "../../symbols";
import type { UserIdParam } from "../../types";

export interface PaginateNotificationsParams {
  userId: string;
  cursor?: { createdAt: Date; id: string };
  pageSize?: number;
}

export interface GetRecentNotificationsParams {
  senderId: string;
  recipientId: string;
  eventType: NotificationType;
  entityId: string;
  entityType: EntityType;
  minutesThreshold: number;
  limit: number;
}
export interface NotificationAndProfile {
  profile: Profile<"onboarded">;
  notification: Notification;
  followStatus: FollowStatus;
}

export interface PushTokenParams {
  userId: string;
  pushToken: string;
}

export interface UpdateNotificationSettingsParams {
  userId: string;
  settings: {
    likes: boolean;
    posts: boolean;
    comments: boolean;
    mentions: boolean;
    friendRequests: boolean;
    followRequests: boolean;
  };
}

type NotificationType = (typeof eventTypeEnum.enumValues)[number];
type EntityType = (typeof entityTypeEnum.enumValues)[number];

export interface SendNotificationParams {
  senderId: string;
  recipientId: string;
  title: string;
  body: string;
  notificationType: NotificationType;
  entityId: string;
  entityType: EntityType;
}

@injectable()
export class NotificationRepository {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.Schema) private readonly schema: Schema,
    @inject(TYPES.SQS) private readonly sqs: SQS,
  ) {}

  async getUnreadNotificationsCount(
    params: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<number> {
    const { userId } = params;

    const result = await db
      .select({ count: count() })
      .from(this.schema.notification)
      .where(
        and(
          eq(this.schema.notification.recipientUserId, userId),
          eq(this.schema.notification.read, false),
        ),
      );

    return result[0]?.count ?? 0;
  }

  async storeNotification(
    params: SendNotificationParams,
    db: DatabaseOrTransaction = this.db,
  ) {
    db.insert(this.schema.notification).values({
      senderUserId: params.senderId,
      recipientUserId: params.recipientId,
      eventType: params.notificationType,
      entityId: params.entityId,
      entityType: params.entityType,
    });
  }

  async getPushTokens(
    params: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<string[]> {
    const { userId } = params;

    const results = await db.query.pushToken.findMany({
      where: eq(this.schema.pushToken.userId, userId),
      columns: { token: true },
    });

    return results.map((result) => result.token);
  }

  async addPushToken(
    { userId, pushToken }: PushTokenParams,
    tx: Transaction,
  ): Promise<void> {
    const pushTokenData = await tx.query.pushToken.findFirst({
      where: and(
        eq(this.schema.pushToken.userId, userId),
        eq(this.schema.pushToken.token, pushToken),
      ),
    });

    if (pushTokenData === undefined) {
      await tx
        .insert(this.schema.pushToken)
        .values({ userId, token: pushToken });
      return;
    }

    await tx
      .update(this.schema.pushToken)
      .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(
        and(
          eq(this.schema.pushToken.userId, userId),
          eq(this.schema.pushToken.token, pushToken),
        ),
      );
  }

  async deletePushToken(
    params: PushTokenParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, pushToken } = params;

    await db
      .delete(this.schema.pushToken)
      .where(
        and(
          eq(this.schema.pushToken.userId, userId),
          eq(this.schema.pushToken.token, pushToken),
        ),
      );
  }

  async getNotificationSettings(
    params: UserIdParam,
    db: DatabaseOrTransaction = this.db,
  ): Promise<NotificationSettings | undefined> {
    const { userId } = params;

    const result = await db.query.notificationSettings.findFirst({
      where: eq(this.schema.notificationSettings.userId, userId),
    });

    return result;
  }

  async updateNotificationSettings(
    params: UpdateNotificationSettingsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<void> {
    const { userId, settings } = params;

    await db
      .update(this.schema.notificationSettings)
      .set({ ...settings })
      .where(eq(this.schema.notificationSettings.userId, userId));
  }

  async paginateNotifications(
    { userId, cursor, pageSize = 10 }: PaginateNotificationsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<NotificationAndProfile[]> {
    let query = db
      .select({
        profile: this.schema.profile,
        notification: this.schema.notification,
        followStatus: getFollowStatusSql(userId),
      })
      .from(this.schema.notification)
      .innerJoin(
        this.schema.profile,
        eq(this.schema.notification.senderUserId, this.schema.profile.userId),
      )
      .innerJoin(
        this.schema.userStatus,
        eq(this.schema.userStatus.userId, this.schema.profile.userId),
      )
      .where(
        and(
          eq(this.schema.notification.recipientUserId, userId),
          eq(this.schema.notification.active, true),
          cursor
            ? or(
                lt(this.schema.notification.createdAt, cursor.createdAt),
                and(
                  eq(this.schema.notification.createdAt, cursor.createdAt),
                  lt(this.schema.notification.id, cursor.id),
                ),
              )
            : undefined,
          onboardingCompletedCondition(this.schema.profile),
        ),
      )
      .orderBy(
        desc(this.schema.notification.createdAt),
        desc(this.schema.notification.id),
      )
      .limit(pageSize);

    const notifications = await query;

    return notifications.map(({ profile, notification, followStatus }) => ({
      profile: profile as Profile<"onboarded">,
      notification,
      followStatus,
    }));
  }

  async sendNotification({
    recipientId,
    notificationType,
  }: SendNotificationParams) {
    const settings = await this.getNotificationSettings({
      userId: recipientId,
    });

    if (settings === undefined) {
      return;
    }

    if (!this.isNotificationEnabled(notificationType, settings)) {
      return;
    }

    const pushTokens = await this.getPushTokens({ userId: recipientId });
    if (pushTokens.length === 0) {
      return;
    }
  }

  isNotificationEnabled(
    notificationType: NotificationType,
    settings: NotificationSettings,
  ): boolean {
    switch (notificationType) {
      case "like":
        return settings.likes;
      case "post":
        return settings.posts;
      case "comment":
        return settings.comments;
      case "follow":
        return settings.followRequests;
      case "friend":
        return settings.friendRequests;
    }
  }

  async getRecentNotifications(
    {
      senderId,
      recipientId,
      entityId,
      entityType,
      eventType,
      minutesThreshold,
      limit,
    }: GetRecentNotificationsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<Notification[]> {
    const notifications = await db
      .select()
      .from(this.schema.notification)
      .where(
        and(
          eq(this.schema.notification.senderUserId, senderId),
          eq(this.schema.notification.recipientUserId, recipientId),
          eq(this.schema.notification.eventType, eventType),
          eq(this.schema.notification.entityId, entityId),
          eq(this.schema.notification.entityType, entityType),
          lt(
            this.schema.notification.createdAt,
            new Date(Date.now() - minutesThreshold * 60 * 1000),
          ),
        ),
      )
      .limit(limit);
    return notifications;
  }
}
