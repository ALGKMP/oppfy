import type { Transaction } from "@oppfy/db";

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
  createFriend(params: CreateFriendParams, db?: Transaction): Promise<void>;

  removeFriend(params: RemoveFriendParams, db?: Transaction): Promise<void>;

  getFriendship(
    params: GetFriendshipParams,
    db?: Transaction,
  ): Promise<{ id: string } | undefined>;

  countFriends(
    params: CountFriendsParams,
    db?: Transaction,
  ): Promise<number | undefined>;

  countFriendRequests(
    params: CountFriendRequestsParams,
    db?: Transaction,
  ): Promise<number | undefined>;

  createFriendRequest(
    params: CreateFriendRequestParams,
    db?: Transaction,
  ): Promise<void>;

  deleteFriendRequest(
    params: DeleteFriendRequestParams,
    db?: Transaction,
  ): Promise<void>;

  getFriendRequest(
    params: GetFriendRequestParams,
    db?: Transaction,
  ): Promise<{ id: string } | undefined>;

  paginateFriendsSelf(
    params: PaginateFriendsSelfParams,
    db?: Transaction,
  ): Promise<FriendResult[]>;

  paginateFriendsOther(
    params: PaginateFriendsOtherParams,
    db?: Transaction,
  ): Promise<FriendResult[]>;

  paginateFriendRequests(
    params: PaginateFriendRequestsParams,
    db?: Transaction,
  ): Promise<FriendRequestResult[]>;

  friendshipExists(
    params: FriendshipExistsParams,
    db?: Transaction,
  ): Promise<boolean>;
}
