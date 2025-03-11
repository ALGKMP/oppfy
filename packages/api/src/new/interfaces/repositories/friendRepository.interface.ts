import { Transaction } from "@oppfy/db";

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
  createFriend(params: CreateFriendParams, tx?: Transaction): Promise<void>;

  removeFriend(params: RemoveFriendParams, tx?: Transaction): Promise<void>;

  getFriendship(
    params: GetFriendshipParams,
    tx?: Transaction,
  ): Promise<{ id: string } | undefined>;

  countFriends(
    params: CountFriendsParams,
    tx?: Transaction,
  ): Promise<number | undefined>;

  countFriendRequests(
    params: CountFriendRequestsParams,
    tx?: Transaction,
  ): Promise<number | undefined>;

  createFriendRequest(
    params: CreateFriendRequestParams,
    tx?: Transaction,
  ): Promise<void>;

  deleteFriendRequest(
    params: DeleteFriendRequestParams,
    tx?: Transaction,
  ): Promise<void>;

  getFriendRequest(
    params: GetFriendRequestParams,
    tx?: Transaction,
  ): Promise<{ id: string } | undefined>;

  paginateFriendsSelf(
    params: PaginateFriendsSelfParams,
    tx?: Transaction,
  ): Promise<FriendResult[]>;

  paginateFriendsOther(
    params: PaginateFriendsOtherParams,
    tx?: Transaction,
  ): Promise<FriendResult[]>;

  paginateFriendRequests(
    params: PaginateFriendRequestsParams,
    tx?: Transaction,
  ): Promise<FriendRequestResult[]>;

  friendshipExists(
    params: FriendshipExistsParams,
    tx?: Transaction,
  ): Promise<boolean>;
}
