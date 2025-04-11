import { inject, injectable } from "inversify";
import { ok, Result } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";

import { FollowStatus, PaginatedResponse } from "../../interfaces/types";
import { HydratedProfile, Notification } from "../../models";
import {
  NotificationRepository,
  PaginateNotificationsParams,
} from "../../repositories/user/notifications.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";

interface NotificationAndHydratedProfile {
  notification: Notification;
  profile: HydratedProfile;
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
