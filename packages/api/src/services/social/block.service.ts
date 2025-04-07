import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import * as BlockErrors from "../../errors/social/block.error";
import type {
  IBlockRepository,
  SocialProfile,
} from "../../interfaces/repositories/social/block.repository.interface";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  GetBlockedUsersParams,
  IBlockService,
} from "../../interfaces/services/social/block.service.interface";
import type {
  DirectionalUserIdsParams,
  PaginatedResponse,
} from "../../interfaces/types";

@injectable()
export class BlockService implements IBlockService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.BlockRepository)
    private readonly blockRepository: IBlockRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: IFollowRepository,
  ) {}

  // Blocks a user after performing necessary checks and cleanup.
  async blockUser({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, BlockErrors.CannotBlockSelf | BlockErrors.AlreadyBlocked>
  > {
    // Prevent a user from blocking themselves
    if (senderUserId === recipientUserId)
      return err(new BlockErrors.CannotBlockSelf(senderUserId));

    await this.db.transaction(async (tx) => {
      // Check if the block already exists
      const isBlocked = await this.blockRepository.getBlock(
        { senderUserId, recipientUserId },
        tx,
      );
      if (isBlocked)
        return err(
          new BlockErrors.AlreadyBlocked(senderUserId, recipientUserId),
        );

      // Clean up all friend and follow relationships concurrently
      await Promise.all([
        this.friendRepository.cleanupFriendRelationships(
          { userIdA: senderUserId, userIdB: recipientUserId },
          tx,
        ),
        this.followRepository.cleanupFollowRelationships(
          { userIdA: senderUserId, userIdB: recipientUserId },
          tx,
        ),
      ]);

      // Create the block
      await this.blockRepository.blockUser(
        { senderUserId, recipientUserId },
        tx,
      );
    });

    // Return success if the transaction completes
    return ok();
  }

  // Unblocks a user if the block exists.
  async unblockUser({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, BlockErrors.BlockNotFound>
  > {
    await this.db.transaction(async (tx) => {
      const isBlocked = await this.blockRepository.getBlock(
        { senderUserId, recipientUserId },
        tx,
      );

      if (!isBlocked)
        return err(
          new BlockErrors.BlockNotFound(senderUserId, recipientUserId),
        );

      await this.blockRepository.unblockUser(
        { senderUserId, recipientUserId },
        tx,
      );
    });

    return ok();
  }

  // Retrieves a paginated list of blocked users.
  async paginateBlockedUsers({
    userId,
    cursor,
    pageSize = 10,
  }: GetBlockedUsersParams): Promise<
    Result<PaginatedResponse<SocialProfile>, never>
  > {
    const rawBlockedProfiles =
      await this.blockRepository.paginateBlockedProfiles({
        userId,
        cursor,
        pageSize: pageSize + 1,
      });

    const hydratedProfiles = rawBlockedProfiles.map((profile) => ({
      ...this.cloudfront.hydrateProfile(profile),
      blockedAt: profile.blockedAt,
    }));

    const hasMore = rawBlockedProfiles.length > pageSize;
    const items = hydratedProfiles.slice(0, pageSize);
    const lastUser = items[items.length - 1];

    return ok({
      items,
      nextCursor:
        hasMore && lastUser
          ? { id: lastUser.userId, createdAt: lastUser.createdAt }
          : null,
    });
  }
}
