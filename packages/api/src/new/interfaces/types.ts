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

export interface PaginationCursor {
  userId: string;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: PaginationCursor | null;
}

export interface PaginationParams {
  cursor?: PaginationCursor | null;
  pageSize?: number;
}
