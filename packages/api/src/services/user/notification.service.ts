import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront, Hydrate } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { FollowStatus } from "@oppfy/db/utils/query-helpers";

import { NotificationSettingsNotFound } from "../../errors/user/notifications.error";
import * as NotificationErrors from "../../errors/user/notifications.error";
import { Notification, NotificationSettings, Profile } from "../../models";
import {
  NotificationRepository,
  PaginateNotificationsParams,
  PushTokenParams,
  UpdateNotificationSettingsParams,
} from "../../repositories/user/notifications.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";
import { PaginatedResponse } from "../../types";

interface NotificationAndHydratedProfile {
  profile: Hydrate<Profile>;
  notification: Notification;
  followStatus: FollowStatus;
}

@injectable()
export class NotificationService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TYPES.CloudFront) private readonly cloudfront: CloudFront,
    @inject(TYPES.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async storePushToken(params: PushTokenParams): Promise<Result<void, never>> {
    await this.db.transaction(async (tx) => {
      await this.notificationRepository.addPushToken(params, tx);
    });

    return ok();
  }

  async deletePushToken(params: PushTokenParams): Promise<Result<void, never>> {
    await this.db.transaction(async (tx) => {
      await this.notificationRepository.deletePushToken(params, tx);
    });

    return ok();
  }

  async notificationSettings(
    userId: string,
  ): Promise<
    Result<
      NotificationSettings,
      NotificationErrors.NotificationSettingsNotFound
    >
  > {
    const settings = await this.notificationRepository.getNotificationSettings({
      userId,
    });

    if (settings === undefined) {
      return err(new NotificationSettingsNotFound(userId));
    }

    return ok(settings);
  }

  async updateNotificationSettings(
    params: UpdateNotificationSettingsParams,
  ): Promise<Result<void, never>> {
    await this.notificationRepository.updateNotificationSettings(params);
    return ok();
  }

  async unreadNotificationsCount(
    userId: string,
  ): Promise<Result<number, never>> {
    const count = await this.notificationRepository.getUnreadNotificationsCount(
      {
        userId,
      },
    );

    return ok(count);
  }

  async paginateNotifications({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateNotificationsParams): Promise<
    Result<PaginatedResponse<NotificationAndHydratedProfile>, never>
  > {
    const notifications =
      await this.notificationRepository.paginateNotifications({
        userId,
        cursor,
        pageSize,
      });

    const notificationsAndHydratedProfiles = notifications.map((data) => ({
      ...data,
      profile: this.cloudfront.hydrateProfile(data.profile),
    }));

    const hasMore = notifications.length > pageSize;
    const items = notificationsAndHydratedProfiles.slice(0, pageSize);
    const lastUser = items[items.length - 1];

    return ok({
      items,
      nextCursor:
        hasMore && lastUser
          ? {
              id: lastUser.notification.id,
              createdAt: lastUser.notification.createdAt,
            }
          : null,
    });
  }
}
