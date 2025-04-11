import { and, count, desc, eq, lt, or, sql } from "drizzle-orm";
import { inject, injectable } from "inversify";

import type {
  Database,
  DatabaseOrTransaction,
  Schema,
  Transaction,
} from "@oppfy/db";
import { getFollowStatusSql } from "@oppfy/db/utils/query-helpers";

import { FollowStatus, UserIdParam } from "../../interfaces/types";
import type { Notification, NotificationSettings, Profile } from "../../models";
import { TYPES } from "../../symbols";

@injectable()
export class NotificationsRepository {
  private db: Database;
  private schema: Schema;

  constructor(
    @inject(TYPES.Database) db: Database,
    @inject(TYPES.Schema) schema: Schema,
  ) {
    this.db = db;
    this.schema = schema;
  }

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
    const { notificationSettingsId, notificationSettings } = params;

    await db
      .update(this.schema.notificationSettings)
      .set({ ...notificationSettings })
      .where(eq(this.schema.notificationSettings.id, notificationSettingsId));
  }

  async paginateNotifications(
    { userId, cursor, pageSize = 10 }: PaginateNotificationsParams,
    db: DatabaseOrTransaction = this.db,
  ): Promise<NotificationAndProfile[]> {
    const notifications = await db
      .select({
        profile: this.schema.profile,
        notification: this.schema.notification,
        followStatus: getFollowStatusSql(this.schema, userId),
      })
      .from(this.schema.notification)
      .innerJoin(
        this.schema.profile,
        eq(this.schema.notification.senderUserId, this.schema.profile.userId),
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
        ),
      )
      .orderBy(
        desc(this.schema.notification.createdAt),
        desc(this.schema.notification.id),
      )
      .limit(pageSize);

    return notifications;
  }
}
interface UpdateNotificationSettingsParams {
  notificationSettingsId: string;
  notificationSettings: NotificationSettings;
}

export interface PaginateNotificationsParams {
  userId: string;
  cursor?: { createdAt: Date; id: string };
  pageSize?: number;
}

export interface NotificationAndProfile {
  profile: Profile;
  notification: Notification;
  followStatus: FollowStatus;
}

export interface PushTokenParams {
  userId: string;
  pushToken: string;
}
