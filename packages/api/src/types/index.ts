export interface UserIdParam {
  userId: string;
}

export interface UsernameParam {
  username: string;
}

export interface CommentIdParam {
  commentId: string;
}

export interface PhoneNumberParam {
  phoneNumber: string;
}

export interface BidirectionalUserIdsparams {
  userIdA: string;
  userIdB: string;
}

export interface DirectionalUserIdsParams {
  senderUserId: string;
  recipientUserId: string;
}

export interface BaseSelfOtherUserIdsParams {
  selfUserId: string;
}

export interface PostIdParam {
  postId: string;
}

export type SelfOtherUserIdsParams<
  T extends "required" | "optional" = "required",
> = BaseSelfOtherUserIdsParams &
  (T extends "optional" ? { otherUserId?: string } : { otherUserId: string });

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
