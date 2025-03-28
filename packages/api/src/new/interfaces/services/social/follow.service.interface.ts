import type { Result } from "neverthrow";

import type { followStatusEnum } from "@oppfy/db";

import type {
  FollowError,
  FollowErrors,
} from "../../../errors/social/follow.error";
import type { UserErrors } from "../../../errors/user/user.error";
import type { Profile } from "../../../models";

export type FollowStatus = (typeof followStatusEnum.enumValues)[number];

// export interface SendFollowRequestParams {
//   senderId: string;
//   recipientId: string;
// }

// export interface AcceptFollowRequestParams {
//   senderId: string;
//   recipientId: string;
// }

// export interface DeclineFollowRequestParams {
//   senderId: string;
//   recipientId: string;
// }

// export interface RemoveFollowParams {
//   followerId: string;
//   followeeId: string;
// }

// export interface GetFollowRequestParams {
//   senderId: string;
//   recipientId: string;
// }

// export interface GetFollowersParams {
//   userId: string;
//   limit?: number;
//   cursor?: string;
// }

// export interface GetFollowingParams {
//   userId: string;
//   limit?: number;
//   cursor?: string;
// }

// export interface GetFollowRequestsParams {
//   userId: string;
//   limit?: number;
//   cursor?: string;
// }

// export interface GetFollowStatusParams {
//   userId: string;
//   targetUserId: string;
// }

// export interface RemoveFollowerParams {
//   userId: string;
//   followerToRemove: string;
// }

// export interface CancelFollowRequestParams {
//   senderId: string;
//   recipientId: string;
// }

export interface IFollowService {
  // sendFollowRequest(
  //   params: SendFollowRequestParams,
  // ): Promise<Result<void, FollowError>>;
  // acceptFollowRequest(
  //   params: AcceptFollowRequestParams,
  // ): Promise<Result<void, FollowError>>;
  // declineFollowRequest(
  //   params: DeclineFollowRequestParams,
  // ): Promise<Result<void, FollowError>>;
  // removeFollow(params: RemoveFollowParams): Promise<Result<void, FollowError>>;
  // getFollowRequest(
  //   params: GetFollowRequestParams,
  // ): Promise<
  //   Result<
  //     { senderId: string; recipientId: string; createdAt: Date } | undefined,
  //     FollowError
  //   >
  // >;
  // paginateFollowers(
  //   params: GetFollowersParams,
  // ): Promise<Result<{ items: Profile[]; nextCursor?: string }, FollowError>>;
  // getFollowing(
  //   params: GetFollowingParams,
  // ): Promise<Result<{ items: Profile[]; nextCursor?: string }, FollowError>>;
  // getFollowRequests(params: GetFollowRequestsParams): Promise<
  //   Result<
  //     {
  //       items: Profile[];
  //       nextCursor?: string;
  //     },
  //     FollowError
  //   >
  // >;
  // getFollowStatus(
  //   params: GetFollowStatusParams,
  // ): Promise<Result<"following" | "requested" | "notFollowing", FollowError>>;
  // removeFollower(
  //   params: RemoveFollowerParams,
  // ): Promise<Result<void, FollowError>>;
  // cancelFollowRequest(
  //   params: CancelFollowRequestParams,
  // ): Promise<Result<void, FollowError>>;
}
