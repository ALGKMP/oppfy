import type { Result } from "neverthrow";

import type { BlockErrors } from "../../../errors/social/block.error";

export interface BlockedUser {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
  createdAt: Date;
}

export interface PaginationCursor {
  createdAt: Date;
  userId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: PaginationCursor | null;
}

export interface IBlockService {
  blockUser(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<
    Result<void, BlockErrors.CannotBlockSelf | BlockErrors.AlreadyBlocked>
  >;

  unblockUser(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<Result<void, BlockErrors.BlockNotFound>>;

  isBlocked(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<Result<boolean, never>>;

  getBlockedUsers(options: {
    userId: string;
    cursor?: PaginationCursor | null;
    pageSize?: number;
  }): Promise<Result<PaginatedResponse<BlockedUser>, never>>;
}
