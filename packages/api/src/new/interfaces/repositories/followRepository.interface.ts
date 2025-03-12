import type { Transaction } from "@oppfy/db";

export interface CreateFollowerParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface RemoveFollowerParams {
  followerId: string;
  followeeId: string;
}

export interface GetFollowerParams {
  followerId: string;
  followeeId: string;
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

export interface DeleteFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface CreateFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface GetFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface AcceptFollowRequestParams {
  senderId: string;
  recipientId: string;
}

export interface PaginateFollowersSelfParams {
  forUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFollowersOthersParams {
  forUserId: string;
  currentUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface GetAllFollowingIdsParams {
  forUserId: string;
}

export interface PaginateFollowingSelfParams {
  userId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFollowingOthersParams {
  forUserId: string;
  currentUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFollowRequestsParams {
  forUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface FollowerResult {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  profileId: string;
  isFollowing?: boolean;
  isFollowRequested?: boolean;
}

export interface FollowRequestResult {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  profileId: string;
}

export interface IFollowRepository {
  createFollower(params: CreateFollowerParams, db?: Transaction): Promise<void>;

  removeFollower(params: RemoveFollowerParams, db?: Transaction): Promise<void>;

  removeFollowRequest(
    senderId: string,
    recipientId: string,
    db?: Transaction,
  ): Promise<void>;

  getFollower(
    params: GetFollowerParams,
    db?: Transaction,
  ): Promise<{ id: string } | undefined>;

  countFollowers(
    params: CountFollowersParams,
    db?: Transaction,
  ): Promise<number | undefined>;

  countFollowing(
    params: CountFollowingParams,
    db?: Transaction,
  ): Promise<number | undefined>;

  countFollowRequests(
    params: CountFollowRequestsParams,
    db?: Transaction,
  ): Promise<number | undefined>;

  deleteFollowRequest(
    params: DeleteFollowRequestParams,
    db?: Transaction,
  ): Promise<void>;

  createFollowRequest(
    params: CreateFollowRequestParams,
    db?: Transaction,
  ): Promise<void>;

  getFollowRequest(
    params: GetFollowRequestParams,
    db?: Transaction,
  ): Promise<{ id: string } | undefined>;

  acceptFollowRequest(
    params: AcceptFollowRequestParams,
    db?: Transaction,
  ): Promise<void>;

  paginateFollowersSelf(
    params: PaginateFollowersSelfParams,
    db?: Transaction,
  ): Promise<FollowerResult[]>;

  paginateFollowersOthers(
    params: PaginateFollowersOthersParams,
    db?: Transaction,
  ): Promise<FollowerResult[]>;

  getAllFollowingIds(
    params: GetAllFollowingIdsParams,
    db?: Transaction,
  ): Promise<string[]>;

  paginateFollowingSelf(
    params: PaginateFollowingSelfParams,
    db?: Transaction,
  ): Promise<FollowerResult[]>;

  paginateFollowingOthers(
    params: PaginateFollowingOthersParams,
    db?: Transaction,
  ): Promise<FollowerResult[]>;

  paginateFollowRequests(
    params: PaginateFollowRequestsParams,
    db?: Transaction,
  ): Promise<FollowRequestResult[]>;
}
