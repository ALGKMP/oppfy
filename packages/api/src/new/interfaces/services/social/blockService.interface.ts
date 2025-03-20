import type { Result } from "neverthrow";

import type { BlockErrors } from "../../../errors/social/block.error";

export interface IBlockService {
  blockUser(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<
    Result<
      void,
      | BlockErrors.CannotBlockSelf
      | BlockErrors.AlreadyBlocked
      | BlockErrors.FailedToBlock
    >
  >;

  unblockUser(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<
    Result<void, BlockErrors.BlockNotFound | BlockErrors.FailedToUnblock>
  >;

  isBlocked(options: {
    blockerId: string;
    blockedId: string;
  }): Promise<Result<boolean, BlockErrors.FailedToCheckBlock>>;

  getBlockedUsers(options: {
    userId: string;
    cursor?: { createdAt: Date; userId: string } | null;
    pageSize?: number;
  }): Promise<
    Result<
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
      BlockErrors.FailedToGetBlockedUsers
    >
  >;
}
