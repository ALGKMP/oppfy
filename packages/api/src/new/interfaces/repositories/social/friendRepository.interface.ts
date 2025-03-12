import type { Result } from "neverthrow";

import type { Transaction } from "@oppfy/db";

import type {
  FriendRequestNotFoundError,
  FriendshipNotFoundError,
  ProfileNotFoundError,
} from "../../../errors/social.errors";

export interface CreateFriendParams {
  senderId: string;
  recipientId: string;
}

export interface RemoveFriendParams {
  userIdA: string;
  userIdB: string;
}

export interface GetFriendshipParams {
  userIdA: string;
  userIdB: string;
}

export interface CountFriendsParams {
  userId: string;
}

export interface CountFriendRequestsParams {
  userId: string;
}

export interface CreateFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface DeleteFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface GetFriendRequestParams {
  senderId: string;
  recipientId: string;
}

export interface PaginateFriendsSelfParams {
  forUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFriendsOtherParams {
  forUserId: string;
  currentUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface PaginateFriendRequestsParams {
  forUserId: string;
  cursor?: { createdAt: Date; profileId: string } | null;
  pageSize?: number;
}

export interface FriendshipExistsParams {
  userIdA: string;
  userIdB: string;
}

export interface FriendResult {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  profileId: string;
  isFriend?: boolean;
  isFriendRequested?: boolean;
}

export interface FriendRequestResult {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  profileId: string;
}

export interface IFriendRepository {
  createFriend(
    params: CreateFriendParams,
    tx?: Transaction,
  ): Promise<Result<void, ProfileNotFoundError>>;

  removeFriend(
    params: RemoveFriendParams,
    tx?: Transaction,
  ): Promise<Result<void, FriendshipNotFoundError | ProfileNotFoundError>>;

  getFriendship(
    params: GetFriendshipParams,
    tx?: Transaction,
  ): Promise<Result<{ id: string } | undefined, never>>;

  countFriends(
    params: CountFriendsParams,
    tx?: Transaction,
  ): Promise<Result<number | undefined, never>>;

  countFriendRequests(
    params: CountFriendRequestsParams,
    tx?: Transaction,
  ): Promise<Result<number | undefined, never>>;

  createFriendRequest(
    params: CreateFriendRequestParams,
    tx?: Transaction,
  ): Promise<Result<void, never>>;

  deleteFriendRequest(
    params: DeleteFriendRequestParams,
    tx?: Transaction,
  ): Promise<Result<void, FriendRequestNotFoundError>>;

  getFriendRequest(
    params: GetFriendRequestParams,
    tx?: Transaction,
  ): Promise<Result<{ id: string } | undefined, never>>;

  paginateFriendsSelf(
    params: PaginateFriendsSelfParams,
    tx?: Transaction,
  ): Promise<Result<FriendResult[], never>>;

  paginateFriendsOther(
    params: PaginateFriendsOtherParams,
    tx?: Transaction,
  ): Promise<Result<FriendResult[], never>>;

  paginateFriendRequests(
    params: PaginateFriendRequestsParams,
    tx?: Transaction,
  ): Promise<Result<FriendRequestResult[], never>>;

  friendshipExists(
    params: FriendshipExistsParams,
    tx?: Transaction,
  ): Promise<Result<boolean, never>>;
}
