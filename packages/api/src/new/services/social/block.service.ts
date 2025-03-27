import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { cloudfront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { BlockErrors } from "../../errors/social/block.error";
import type {
  IBlockRepository,
  SocialProfile,
} from "../../interfaces/repositories/social/block.repository.interface";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  BlockedUser,
  BlockUserParams,
  GetBlockedUsersParams,
  IBlockService,
  IsBlockedParams,
  PaginatedResponse,
  UnblockUserParams,
} from "../../interfaces/services/social/block.service.interface";
import type { Profile } from "../../models";

@injectable()
export class BlockService implements IBlockService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.BlockRepository)
    private readonly blockRepository: IBlockRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: IFollowRepository,
  ) {}

  async blockUser({
    blockerId,
    blockedId,
  }: BlockUserParams): Promise<
    Result<void, BlockErrors.CannotBlockSelf | BlockErrors.AlreadyBlocked>
  > {
    // Prevent a user from blocking themselves
    if (blockerId === blockedId)
      return err(new BlockErrors.CannotBlockSelf(blockerId));

    await this.db.transaction(async (tx) => {
      // Check if the block already exists
      const isBlocked = await this.blockRepository.getBlock(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );
      if (isBlocked)
        return err(new BlockErrors.AlreadyBlocked(blockerId, blockedId));

      // Clean up all friend and follow relationships concurrently
      await Promise.all([
        this.friendRepository.cleanupFriendRelationships(
          { userIdA: blockerId, userIdB: blockedId },
          tx,
        ),
        this.followRepository.cleanupFollowRelationships(
          { userIdA: blockerId, userIdB: blockedId },
          tx,
        ),
      ]);

      // Create the block
      await this.blockRepository.blockUser(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );
    });

    // Return success if the transaction completes
    return ok();
  }

  async unblockUser({
    blockerId,
    blockedId,
  }: UnblockUserParams): Promise<Result<void, BlockErrors.BlockNotFound>> {
    await this.db.transaction(async (tx) => {
      const isBlocked = await this.blockRepository.getBlock(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );

      if (!isBlocked)
        return err(new BlockErrors.BlockNotFound(blockerId, blockedId));

      await this.blockRepository.unblockUser(
        { userId: blockerId, blockedUserId: blockedId },
        tx,
      );
    });

    return ok();
  }

  async isBlocked({
    blockerId,
    blockedId,
  }: IsBlockedParams): Promise<Result<boolean, never>> {
    const block = await this.blockRepository.getBlock({
      userId: blockerId,
      blockedUserId: blockedId,
    });
    return ok(!!block);
  }

  async paginateBlockedUsers({
    userId,
    cursor,
    pageSize = 10,
  }: GetBlockedUsersParams): Promise<
    Result<PaginatedResponse<BlockedUser>, never>
  > {
    const rawBlockedData = await this.blockRepository.paginateBlockedProfiles({
      userId,
      cursor: cursor,
      limit: pageSize + 1,
    });

    const hydratedBlockedUsers = rawBlockedData.map((profile) =>
      this.hydrateAndTransformBlockedUser(profile),
    );

    const lastUser = hydratedBlockedUsers[pageSize - 1];

    return ok({
      items: hydratedBlockedUsers.slice(0, pageSize),
      nextCursor:
        rawBlockedData.length > pageSize && lastUser
          ? {
              userId: lastUser.userId,
              createdAt: lastUser.blockedAt,
            }
          : null,
    });
  }

  private hydrateAndTransformBlockedUser(profile: SocialProfile): BlockedUser {
    const hydratedProfile = cloudfront.hydrateProfile(profile);

    return {
      userId: hydratedProfile.userId,
      username: hydratedProfile.username,
      name: hydratedProfile.name,
      profilePictureUrl: hydratedProfile.profilePictureUrl,
      blockedAt: profile.blockedAt,
    };
  }
}
