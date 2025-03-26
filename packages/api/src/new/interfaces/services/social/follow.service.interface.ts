import type { Result } from "neverthrow";

import type { followStatusEnum } from "@oppfy/db";

import type { FollowErrors } from "../../../errors/social/follow.error";
import type { UserErrors } from "../../../errors/user/user.error";
export type FollowStatus = (typeof followStatusEnum.enumValues)[number];

export interface IsFollowingParams {
  followerId: string;
  followeeId: string;
}

export interface SendFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface AcceptFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface DeclineFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface RemoveFollowParams {
  followerId: string;
  followeeId: string;
}

export interface GetFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface CountFollowersParams {
  userId: string;
}

export interface CountFollowingParams {
  userId: string;
}

export interface CountFollowRequestsParams {
  userId: string;
}

export interface GetFollowersParams {
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface GetFollowingParams {
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface GetFollowRequestsParams {
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface GetFollowStatusParams {
  userId: string;
  targetUserId: string;
}

export interface RemoveFollowerParams {
  userId: string;
  followerToRemove: string;
}

export interface CancelFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface IFollowService {
  isFollowing(params: IsFollowingParams): Promise<Result<boolean, never>>;

  sendFollowRequest(
    params: SendFollowRequestParams,
  ): Promise<
    Result<
      void,
      | FollowErrors.AlreadyFollowing
      | FollowErrors.RequestAlreadySent
      | FollowErrors.CannotFollowSelf
      | FollowErrors.FailedToSendRequest
      | UserErrors.UserNotFound
    >
  >;

  acceptFollowRequest(
    params: AcceptFollowRequestParams,
  ): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToAcceptRequest
    >
  >;

  declineFollowRequest(
    params: DeclineFollowRequestParams,
  ): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToDeclineRequest
    >
  >;

  removeFollow(
    params: RemoveFollowParams,
  ): Promise<
    Result<void, FollowErrors.NotFollowing | FollowErrors.FailedToRemove>
  >;

  getFollowRequest(
    params: GetFollowRequestParams,
  ): Promise<
    Result<
      { senderId: string; recipientId: string; createdAt: Date } | undefined,
      never
    >
  >;

  countFollowers(
    params: CountFollowersParams,
  ): Promise<Result<number, FollowErrors.FailedToCountFollowers>>;

  countFollowing(
    params: CountFollowingParams,
  ): Promise<Result<number, FollowErrors.FailedToCountFollowing>>;

  countFollowRequests(
    params: CountFollowRequestsParams,
  ): Promise<Result<number, FollowErrors.FailedToCountRequests>>;

  getFollowers(
    params: GetFollowersParams,
  ): Promise<
    Result<
      { items: Array<{ id: string; username: string }>; nextCursor?: string },
      never
    >
  >;

  getFollowing(
    params: GetFollowingParams,
  ): Promise<
    Result<
      { items: Array<{ id: string; username: string }>; nextCursor?: string },
      never
    >
  >;

  getFollowRequests(params: GetFollowRequestsParams): Promise<
    Result<
      {
        items: Array<{ id: string; username: string; createdAt: Date }>;
        nextCursor?: string;
      },
      never
    >
  >;

  getFollowStatus(
    params: GetFollowStatusParams,
  ): Promise<Result<"following" | "requested" | "notFollowing", never>>;

  removeFollower(
    params: RemoveFollowerParams,
  ): Promise<
    Result<void, FollowErrors.NotFollowing | FollowErrors.FailedToRemove>
  >;

  cancelFollowRequest(
    params: CancelFollowRequestParams,
  ): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToDeclineRequest
    >
  >;
}
