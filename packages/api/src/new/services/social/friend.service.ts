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
import { UserNotFound } from "../../errors/user/user.error";
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

  isFollowing(params: IsFollowingParams): Promise<Result<boolean, never>> {
    throw new Error("Method not implemented.");
  }
  sendFriendRequest(
    params: SendFriendRequestParams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  acceptFriendRequest(
    params: AcceptFriendRequestParams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  declineFriendRequest(
    params: DeclineFriendRequestParams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  cancelFriendRequest(
    params: CancelFriendRequestParams,
  ): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
  getFriendRequest(
    params: GetFriendRequestParams,
  ): Promise<Result<FriendRequest | undefined, never>> {
    throw new Error("Method not implemented.");
  }
  removeFriend(params: RemoveFriendParams): Promise<Result<void, FriendError>> {
    throw new Error("Method not implemented.");
  }
}
