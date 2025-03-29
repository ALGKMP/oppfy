import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { FriendError } from "../../errors/social/friend.error";
import { UserError } from "../../errors/user/user.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notification.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  AcceptFriendRequestParams,
  CancelFriendRequestParams,
  DeclineFriendRequestParams,
  GetFriendRequestParams,
  IFriendService,
  IsFollowingParams,
  RemoveFriendParams,
  SendFriendRequestParams,
} from "../../interfaces/services/social/friend.service.interface";
import { FriendRequest } from "../../models";

@injectable()
export class FriendService implements IFriendService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: IFollowRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.NotificationsRepository)
    private readonly notificationsRepository: INotificationsRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
  ) {}

  async isFollowing({
    senderUserId,
    recipientUserId,
  }: IsFollowingParams): Promise<Result<boolean, never>> {
    const follower = await this.followRepository.getFollower({
      senderUserId,
      recipientUserId,
    });
    return ok(!!follower);
  }

  async sendFriendRequest({
    senderUserId,
    recipientUserId,
  }: SendFriendRequestParams): Promise<Result<void, FriendError>> {
    if (senderUserId === recipientUserId) {
      return err(new FriendError.CannotFriendSelf(senderUserId));
    }

    const recipient = await this.userRepository.getUser({
      userId: recipientUserId,
    });
    if (!recipient) {
      return err(new UserError.UserNotFound(recipientUserId));
    }

    await this.db.transaction(async (tx) => {
      const areFriends = await this.friendRepository.getFriend(
        { userIdA: senderUserId, userIdB: recipientUserId },
        tx,
      );
      if (areFriends) {
        throw new FriendError.AlreadyFriends(senderUserId, recipientUserId);
      }

      const existingRequest = await this.friendRepository.getFriendRequest(
        { senderUserId, recipientUserId },
        tx,
      );
      if (existingRequest) {
        throw new FriendError.RequestAlreadySent(senderUserId, recipientUserId);
      }

      await this.friendRepository.createFriendRequest(
        { senderUserId, recipientUserId },
        tx,
      );
    });

    return ok(undefined);
  }

  async acceptFriendRequest({
    senderUserId,
    recipientUserId,
  }: AcceptFriendRequestParams): Promise<Result<void, FriendError>> {
    await this.db.transaction(async (tx) => {
      const request = await this.friendRepository.getFriendRequest(
        { senderUserId, recipientUserId },
        tx,
      );
      if (!request) {
        throw new FriendErrors.RequestNotFound(senderUserId, recipientUserId);
      }

      await this.friendRepository.deleteFriendRequest(
        { senderUserId, recipientUserId },
        tx,
      );
      await this.friendRepository.createFriend(
        { userIdA: senderUserId, userIdB: recipientUserId },
        tx,
      );

      await this.followRepository.createFollower(
        { senderUserId, recipientUserId },
        tx,
      );
      await this.followRepository.createFollower(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );

      const sender = await this.userRepository.getUser(
        { userId: senderUserId },
        tx,
      );
      if (!sender) throw new UserErrors.UserNotFound(senderUserId);

      const notificationSettings =
        await this.notificationsRepository.getNotificationSettings(
          { notificationSettingsId: sender.notificationSettingsId },
          tx,
        );
      if (notificationSettings?.friendRequests) {
        await this.notificationsRepository.storeNotification(
          {
            senderId: recipientUserId,
            recipientId: senderUserId,
            notificationData: {
              eventType: "friend",
              entityType: "profile",
              entityId: recipientUserId,
            },
          },
          tx,
        );
      }
    });

    return ok(undefined);
  }

  async declineFriendRequest({
    senderUserId,
    recipientUserId,
  }: DeclineFriendRequestParams): Promise<Result<void, FriendError>> {
    const request = await this.friendRepository.getFriendRequest({
      senderUserId,
      recipientUserId,
    });
    if (!request) {
      return err(
        new FriendErrors.RequestNotFound(senderUserId, recipientUserId),
      );
    }

    await this.friendRepository.deleteFriendRequest({
      senderUserId,
      recipientUserId,
    });

    return ok(undefined);
  }

  async cancelFriendRequest({
    senderUserId,
    recipientUserId,
  }: CancelFriendRequestParams): Promise<Result<void, FriendError>> {
    const request = await this.friendRepository.getFriendRequest({
      senderUserId,
      recipientUserId,
    });
    if (!request) {
      return err(
        new FriendErrors.RequestNotFound(senderUserId, recipientUserId),
      );
    }

    await this.friendRepository.deleteFriendRequest({
      senderUserId,
      recipientUserId,
    });

    return ok(undefined);
  }

  async getFriendRequest({
    senderUserId,
    recipientUserId,
  }: GetFriendRequestParams): Promise<
    Result<FriendRequest | undefined, never>
  > {
    const request = await this.friendRepository.getFriendRequest({
      senderUserId,
      recipientUserId,
    });
    return ok(request);
  }

  async removeFriend({
    senderUserId,
    recipientUserId,
  }: RemoveFriendParams): Promise<Result<void, FriendError>> {
    const friendship = await this.friendRepository.getFriend({
      userIdA: senderUserId,
      userIdB: recipientUserId,
    });
    if (!friendship) {
      return err(new FriendError.NotFriends(senderUserId, recipientUserId));
    }

    await this.db.transaction(async (tx) => {
      await this.friendRepository.deleteFriend(
        { userIdA: senderUserId, userIdB: recipientUserId },
        tx,
      );

      await this.followRepository.deleteFollower(
        { senderUserId, recipientUserId },
        tx,
      );
      await this.followRepository.deleteFollower(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );
    });

    return ok(undefined);
  }
}
