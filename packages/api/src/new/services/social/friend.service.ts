import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import {
  AlreadyFriends,
  CannotFriendSelf,
  FriendError,
  NotFound,
  RequestAlreadySent,
  RequestNotFound,
} from "../../errors/social/friend.error";
import * as FriendErrors from "../../errors/social/friend.error";
import { UserNotFound } from "../../errors/user/user.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notification.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  IFriendService,
  PaginateByUserIdParams,
  PaginateResult,
} from "../../interfaces/services/social/friend.service.interface";
import {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
} from "../../interfaces/types";
import { FriendRequest } from "../../models";

@injectable()
export class FriendService implements IFriendService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
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

  async friendUser({
    recipientUserId,
    senderUserId,
  }: DirectionalUserIdsParams): Promise<Result<void, FriendError>> {
    // prevent a user from friending themselves
    if (senderUserId === recipientUserId) {
      return err(new FriendErrors.CannotFriendSelf(senderUserId));
    }

    const [isFriends, isRequestedOutgoing, isRequestedIncoming] =
      await Promise.all([
        this.friendRepository.getFriend({
          userIdA: senderUserId,
          userIdB: recipientUserId,
        }),
        this.friendRepository.getFriendRequest({
          senderUserId,
          recipientUserId,
        }),
        this.friendRepository.getFriendRequest({
          senderUserId: recipientUserId,
          recipientUserId: senderUserId,
        }),
      ]);

    // check if the users are already friends
    if (isFriends)
      return err(
        new FriendErrors.AlreadyFriends(senderUserId, recipientUserId),
      );

    // check if a friend request is pending
    if (isRequestedOutgoing)
      return err(
        new FriendErrors.RequestAlreadySent(senderUserId, recipientUserId),
      );

    // check if a friend request is pending from the recipient to the sender
    if (isRequestedIncoming) {
      await this.db.transaction(async (tx) => {
        await this.friendRepository.createFriend(
          {
            userIdA: senderUserId,
            userIdB: recipientUserId,
          },
          tx,
        );

        await this.followRepository.deleteFollowRequest(
          {
            senderUserId,
            recipientUserId,
          },
          tx,
        );

        await this.friendRepository.deleteFriendRequest(
          {
            senderUserId: recipientUserId,
            recipientUserId: senderUserId,
          },
          tx,
        );
      });

      return ok();
    }

    // create a friend request
    await this.friendRepository.createFriendRequest({
      senderUserId,
      recipientUserId,
    });

    return ok();
  }

  unfriendUser(
    params: BidirectionalUserIdsparams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  acceptFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  declineFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  cancelFriendRequest(
    params: DirectionalUserIdsParams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  paginateFriends(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FriendError>> {
    throw new Error("Method not implemented.");
  }
  paginateFriendRequests(
    params: PaginateByUserIdParams,
  ): Promise<Result<PaginateResult, FriendError>> {
    throw new Error("Method not implemented.");
  }
}
