import type { Result, ResultAsync } from "neverthrow";

import type { DomainError } from "../../../../errors";

export type BlockUserError = DomainError & {
  code:
    | "CANNOT_FOLLOW_SELF"
    | "RELATIONSHIP_ALREADY_EXISTS"
    | "FAILED_TO_BLOCK_USER";
};

export type UnblockUserError = DomainError & {
  code: "FAILED_TO_CHECK_RELATIONSHIP" | "FAILED_TO_UNBLOCK_USER";
};

export interface IBlockService {
  blockUser(options: {
    blockerId: string;
    blockedId: string;
  }): ResultAsync<void, BlockUserError>;

  unblockUser(options: {
    blockerId: string;
    blockedId: string;
  }): ResultAsync<void, UnblockUserError>;

  isBlocked(options: {
    blockerId: string;
    blockedId: string;
  }): ResultAsync<boolean, DomainError>;

  getBlockedUsers(options: {
    userId: string;
    cursor?: { createdAt: Date; userId: string } | null;
    pageSize?: number;
  }): ResultAsync<
    {
      items: {
        userId: string;
        username: string;
        name: string;
        profilePictureUrl: string | null;
        createdAt: Date;
      }[];
      nextCursor: { createdAt: Date; userId: string } | null;
    },
    DomainError
  >;
}
