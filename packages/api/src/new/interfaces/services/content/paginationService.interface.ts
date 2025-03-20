export interface Cursor {
  createdAt: Date;
  profileId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: Cursor | null;
}

export interface IPaginationService {
  paginateFollowersSelf(options: {
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

  paginateFollowersOthers(options: {
    userId: string;
    currentUserId: string;
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

  paginateFollowingSelf(options: {
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

  paginateFollowingOthers(options: {
    userId: string;
    currentUserId: string;
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

  paginateFriendsSelf(options: {
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
