import { Transaction } from "@oppfy/db";

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
  createFollower(params: CreateFollowerParams, tx?: Transaction): Promise<void>;

  removeFollower(params: RemoveFollowerParams, tx?: Transaction): Promise<void>;

  removeFollowRequest(
    senderId: string,
    recipientId: string,
    tx?: Transaction,
  ): Promise<void>;

  getFollower(
    params: GetFollowerParams,
    tx?: Transaction,
  ): Promise<{ id: string } | undefined>;

  countFollowers(
    params: CountFollowersParams,
    tx?: Transaction,
  ): Promise<number | undefined>;

  countFollowing(
    params: CountFollowingParams,
    tx?: Transaction,
  ): Promise<number | undefined>;

  countFollowRequests(
    params: CountFollowRequestsParams,
    tx?: Transaction,
  ): Promise<number | undefined>;

  deleteFollowRequest(
    params: DeleteFollowRequestParams,
    tx?: Transaction,
  ): Promise<void>;

  createFollowRequest(
    params: CreateFollowRequestParams,
    tx?: Transaction,
  ): Promise<void>;

  getFollowRequest(
    params: GetFollowRequestParams,
    tx?: Transaction,
  ): Promise<{ id: string } | undefined>;

  acceptFollowRequest(
    params: AcceptFollowRequestParams,
    tx?: Transaction,
  ): Promise<void>;

  paginateFollowersSelf(
    params: PaginateFollowersSelfParams,
    tx?: Transaction,
  ): Promise<FollowerResult[]>;

  paginateFollowersOthers(
    params: PaginateFollowersOthersParams,
    tx?: Transaction,
  ): Promise<FollowerResult[]>;

  getAllFollowingIds(
    params: GetAllFollowingIdsParams,
    tx?: Transaction,
  ): Promise<string[]>;

  paginateFollowingSelf(
    params: PaginateFollowingSelfParams,
    tx?: Transaction,
  ): Promise<FollowerResult[]>;

  paginateFollowingOthers(
    params: PaginateFollowingOthersParams,
    tx?: Transaction,
  ): Promise<FollowerResult[]>;

  paginateFollowRequests(
    params: PaginateFollowRequestsParams,
    tx?: Transaction,
  ): Promise<FollowRequestResult[]>;
}
