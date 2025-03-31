export type FollowStatus = "FOLLOWING" | "REQUESTED" | "NOT_FOLLOWING";
export type FriendStatus = "FRIENDS" | "REQUESTED" | "NOT_FRIENDS";
export type BlockStatus = "BLOCKED" | "NOT_BLOCKED";
export type Privacy = "PUBLIC" | "PRIVATE";

export interface UserIdParam {
  userId: string;
}

export interface BidirectionalUserIdsparams {
  userIdA: string;
  userIdB: string;
}

export interface DirectionalUserIdsParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface SelfOtherUserIdsParams {
  selfUserId: string;
  otherUserId: string;
}

interface Cursor {
  id: string;
  createdAt: Date;
}

export type PaginationCursor = Cursor | null;

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: PaginationCursor;
}

export interface PaginationParams {
  cursor?: PaginationCursor;
  pageSize?: number;
}
