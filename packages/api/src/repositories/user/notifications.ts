import type { z } from "zod";

import { aliasedTable, and, asc, db, eq, gt, or, schema, sql } from "@oppfy/db";
import { PublishCommand, sns } from "@oppfy/sns";
import type { sharedValidators, trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode, handleDatabaseErrors } from "../../errors";

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
  typeof trpcValidators.input.notifications.updateNotificationSettings
>;

export class NotificationsRepository {
  private db = db;
  private sns = sns;

  @handleDatabaseErrors
  async updatePushToken(userId: string, pushToken: string) {
    await this.db
      .update(schema.user)
      .set({ pushToken })
      .where(eq(schema.user.id, userId));
  }

  @handleDatabaseErrors
  async getNotificationSettings(notificationSettingId: number) {
    const possibleNotificationSettings =
      await this.db.query.notificationSettings.findFirst({
        where: eq(schema.notificationSettings.id, notificationSettingId),
        columns: {
          posts: true,
          likes: true,
          comments: true,
          mentions: true,
          friendRequests: true,
          followRequests: true,
        },
      });

    return possibleNotificationSettings;
  }

  @handleDatabaseErrors
  async paginateNotifications(
    userId: string,
    cursor: { createdAt: Date } | null = null,
    pageSize = 10,
  ) {
    const followerTable = aliasedTable(schema.follower, "followerTable");
    const followRequestTable = aliasedTable(
      schema.followRequest,
      "followRequestTable",
    );

    const notifications = await this.db
      .select({
        profileId: schema.profile.id,
        username: schema.profile.username,
        profilePictureKey: schema.profile.profilePictureKey,
        eventType: schema.notifications.eventType,
        entityId: schema.notifications.entityId,
        entityType: schema.notifications.entityType,
        createdAt: schema.notifications.createdAt,
        relationshipState: sql<
          "following" | "followRequestSent" | "notFollowing"
        >`
      CASE
          WHEN ${followerTable.id} IS NOT NULL THEN 'following'
          WHEN ${followRequestTable.id} IS NOT NULL THEN 'followRequestSent'
          ELSE 'notFollowing'
        END
      `,
      })
      .from(schema.notifications)
      .innerJoin(schema.user, eq(schema.notifications.senderId, schema.user.id))
      .innerJoin(schema.profile, eq(schema.user.profileId, schema.profile.id))
      .leftJoin(
        followerTable,
        and(
          eq(followerTable.senderId, userId),
          eq(followerTable.recipientId, schema.user.id),
        ),
      )
      .leftJoin(
        followRequestTable,
        and(
          eq(followRequestTable.senderId, userId),
          eq(followRequestTable.recipientId, schema.user.id),
        ),
      )
      .where(
        and(
          eq(schema.notifications.recipientId, userId),
          cursor
            ? gt(schema.notifications.createdAt, cursor.createdAt)
            : undefined,
        ),
      )
      .orderBy(
        asc(schema.notifications.createdAt),
        asc(schema.notifications.id),
      )
      .limit(pageSize);

    return notifications;
  }

  @handleDatabaseErrors
  async updateNotificationSettings(
    notificationSettingsId: number,
    notificationSettings: NotificationSettings,
  ) {
    await this.db
      .update(schema.notificationSettings)
      .set({
        ...notificationSettings,
      })
      .where(eq(schema.notificationSettings.id, notificationSettingsId));
  }

  @handleDatabaseErrors
  async storeNotification(
    senderId: string,
    recipientId: string,
    notificationData: StoreNotificationData,
  ) {
    await this.db.insert(schema.notifications).values({
      senderId,
      recipientId,
      ...notificationData,
    });
  }

  async sendNotification(
    pushToken: string,
    senderId: string,
    recipientId: string,
    notificationData: SendNotificationData,
  ) {
    const message = {
      senderId,
      recipientId,
      pushToken,
      ...notificationData,
    } satisfies SnsNotificationData;

    const params = {
      Subject: "New notification",
      TopicArn: process.env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,
      Message: JSON.stringify(message),
    };

    await this.sns.send(new PublishCommand(params));
  }

  @handleDatabaseErrors
  async getPushToken(userId: string) {
    const user = await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      columns: {
        pushToken: true,
      },
    });

    if (user === undefined) {
      throw new DomainError(ErrorCode.USERNAME_NOT_FOUND);
    }

    return user.pushToken;
  }
}
