import type { Cursor } from "@oppfy/db";

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Cursor | null;
}

export interface PaginateFollowersSelfParams {
  userId: string;
  cursor: Cursor | null;
  pageSize?: number;
}

export interface PaginateFollowersOthersParams {
  userId: string;
  currentUserId: string;
  cursor: Cursor | null;
  pageSize?: number;
}

export interface PaginateFollowingSelfParams {
  userId: string;
  cursor: Cursor | null;
  pageSize?: number;
}

export interface PaginateFollowingOthersParams {
  userId: string;
  currentUserId: string;
  cursor: Cursor | null;
  pageSize?: number;
}

export interface PaginateFriendsSelfParams {
  userId: string;
  cursor: Cursor | null;
  pageSize?: number;
}

export interface IPaginationService {
  paginateFollowersSelf(params: PaginateFollowersSelfParams): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateFollowersOthers(params: PaginateFollowersOthersParams): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateFollowingSelf(params: PaginateFollowingSelfParams): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateFollowingOthers(params: PaginateFollowingOthersParams): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateFriendsSelf(params: PaginateFriendsSelfParams): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateFriendsOthers(options: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
    currentUserId: string;
  }): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateBlocked(options: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateFriendRequests(options: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;

  paginateFollowRequests(options: {
    userId: string;
    cursor: Cursor | null;
    pageSize?: number;
  }): Promise<
    PaginatedResponse<{
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
      profileId: string;
    }>
  >;
}
