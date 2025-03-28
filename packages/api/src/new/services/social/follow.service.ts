import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { cloudfront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { FollowErrors } from "../../errors/social/follow.error";
import { ProfileErrors } from "../../errors/user/profile.error";
import { UserErrors } from "../../errors/user/user.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  IFollowService,
  PaginateByUserIdParams,
  PaginateResult,
} from "../../interfaces/services/social/follow.service.interface";
import type { DirectionalUserIdsParams } from "../../interfaces/types";

@injectable()
export class FollowService implements IFollowService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: IFollowRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
  ) {}

  /**
   * Allows a user to follow another user, creating a follower relationship if the target account is public,
   * or a follow request if it's private, after performing necessary checks.
   */
  async followUser({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<
      void,
      | FollowErrors.CannotFollowSelf
      | ProfileErrors.ProfileNotFound
      | FollowErrors.AlreadyFollowing
      | FollowErrors.RequestAlreadySent
    >
  > {
    // Prevent a user from following themselves
    if (senderUserId === recipientUserId) {
      return err(new FollowErrors.CannotFollowSelf(senderUserId));
    }

    // Verify the recipient exists
    const recipientProfile = await this.profileRepository.getProfile({
      userId: recipientUserId,
    });
    if (recipientProfile === undefined)
      return err(new ProfileErrors.ProfileNotFound(recipientUserId));

    await this.db.transaction(async (tx) => {
      // Check if the user is already following the recipient
      const isFollowing = await this.followRepository.getFollower(
        { senderUserId, recipientUserId },
        tx,
      );
      if (isFollowing)
        return err(
          new FollowErrors.AlreadyFollowing(senderUserId, recipientUserId),
        );

      // Check if a follow request is already pending
      const isRequested = await this.followRepository.getFollowRequest(
        { senderUserId, recipientUserId },
        tx,
      );
      if (isRequested) {
        return err(
          new FollowErrors.RequestAlreadySent(senderUserId, recipientUserId),
        );
      }

      // Based on privacy, either create a follower relationship or a follow request
      await this.followRepository[
        recipientProfile.privacy === "public"
          ? "createFollower"
          : "createFollowRequest"
      ]({ senderUserId, recipientUserId }, tx);
    });
    return ok();
  }

  /**
   * Allows a user to unfollow another user by removing the follower relationship, and the friend relationship if it exists.
   */
  async unfollowUser({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, FollowErrors.NotFollowing>
  > {
    await this.db.transaction(async (tx) => {
      const [isFollowing, isFriends, isFriendRequested] = await Promise.all([
        this.followRepository.getFollower(
          { senderUserId, recipientUserId },
          tx,
        ),
        this.friendRepository.getFriend(
          { userIdA: senderUserId, userIdB: recipientUserId },
          tx,
        ),
        this.friendRepository.getFriendRequest(
          { senderUserId, recipientUserId },
          tx,
        ),
      ]);

      if (!isFollowing)
        return err(
          new FollowErrors.NotFollowing(senderUserId, recipientUserId),
        );

      if (isFriends) {
        await this.friendRepository.deleteFriend(
          { userIdA: senderUserId, userIdB: recipientUserId },
          tx,
        );
      } else if (isFriendRequested) {
        await this.friendRepository.deleteFriendRequest(
          { senderUserId, recipientUserId },
          tx,
        );
      }

      await this.followRepository.deleteFollower(
        { senderUserId, recipientUserId },
        tx,
      );
    });

    return ok();
  }

  /**
   * Removes a follower from the user's followers list by deleting the follower relationship.
   * Here, senderUserId is the user performing the action, and recipientUserId is the follower to remove.
   */
  async removeFollower({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<Result<void, FollowErrors>> {
    try {
      await this.db.transaction(async (tx) => {
        // Check if recipientUserId is following senderUserId
        const isFollowing = await this.followRepository.getFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
        if (!isFollowing) {
          throw new FollowErrors.NotFollowing(recipientUserId, senderUserId);
        }

        await this.followRepository.deleteFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
      });
      return ok();
    } catch (error) {
      if (error instanceof FollowErrors.NotFollowing) {
        return err(error);
      }
      return err(new FollowErrors.FailedToRemoveFollower(error));
    }
  }

  /**
   * Accepts a pending follow request, creating a follower relationship.
   * senderUserId is the user accepting (recipient of the request), recipientUserId is the requester.
   */
  async acceptFollowRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<Result<void, FollowErrors>> {
    try {
      await this.db.transaction(async (tx) => {
        const isRequested = await this.followRepository.getFollowRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
        if (!isRequested) {
          throw new FollowErrors.RequestNotFound(recipientUserId, senderUserId);
        }

        await this.followRepository.deleteFollowRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
        await this.followRepository.createFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
      });
      return ok();
    } catch (error) {
      if (error instanceof FollowErrors.RequestNotFound) {
        return err(error);
      }
      return err(new FollowErrors.FailedToAcceptRequest(error));
    }
  }

  /**
   * Declines a pending follow request.
   * senderUserId is the user declining (recipient of the request), recipientUserId is the requester.
   */
  async declineFollowRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<Result<void, FollowErrors>> {
    try {
      await this.db.transaction(async (tx) => {
        const isRequested = await this.followRepository.getFollowRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
        if (!isRequested) {
          throw new FollowErrors.RequestNotFound(recipientUserId, senderUserId);
        }

        await this.followRepository.deleteFollowRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
      });
      return ok();
    } catch (error) {
      if (error instanceof FollowErrors.RequestNotFound) {
        return err(error);
      }
      return err(new FollowErrors.FailedToDeclineRequest(error));
    }
  }

  /**
   * Cancels a user's own pending follow request.
   * senderUserId is the user canceling (sender of the request), recipientUserId is the target.
   */
  async cancelFollowRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<Result<void, FollowErrors>> {
    try {
      await this.db.transaction(async (tx) => {
        const isRequested = await this.followRepository.getFollowRequest(
          { senderUserId, recipientUserId },
          tx,
        );
        if (!isRequested) {
          throw new FollowErrors.RequestNotFound(senderUserId, recipientUserId);
        }

        await this.followRepository.deleteFollowRequest(
          { senderUserId, recipientUserId },
          tx,
        );
      });
      return ok();
    } catch (error) {
      if (error instanceof FollowErrors.RequestNotFound) {
        return err(error);
      }
      return err(new FollowErrors.FailedToCancelRequest(error));
    }
  }

  /**
   * Retrieves a paginated list of the user's followers.
   * For each follower, followStatus indicates if the user follows them back.
   */
  async paginateFollowersSelf({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<Result<PaginateResult, FollowErrors>> {
    const profiles = await this.followRepository.paginateFollowers({
      otherUserId: userId,
      cursor: cursor
        ? { createdAt: new Date(cursor.createdAt), userId: cursor.userId }
        : null,
      limit: pageSize + 1,
    });

    const items = await Promise.all(
      profiles.slice(0, pageSize).map(async (profile) => {
        const followsBack = await this.followRepository.getFollower({
          senderUserId: userId,
          recipientUserId: profile.userId,
        });
        return {
          ...cloudfront.hydrateProfile(profile),
          followStatus: followsBack ? "FOLLOWING" : "NOT_FOLLOWING",
          privacy: profile.privacy,
        };
      }),
    );

    const hasMore = profiles.length > pageSize;
    const nextCursor = hasMore
      ? {
          userId: profiles[pageSize - 1].userId,
          createdAt: profiles[pageSize - 1].followedAt,
        }
      : null;

    return ok({ items, nextCursor });
  }

  /**
   * Retrieves a paginated list of users the specified user is following.
   * followStatus is always "FOLLOWING" since these are users the user follows.
   */
  async paginateFollowingSelf({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<Result<PaginateResult, FollowErrors>> {
    const profiles = await this.followRepository.paginateFollowing({
      otherUserId: userId,
      cursor: cursor
        ? { createdAt: new Date(cursor.createdAt), userId: cursor.userId }
        : null,
      limit: pageSize + 1,
    });

    const items = profiles.slice(0, pageSize).map((profile) => ({
      ...cloudfront.hydrateProfile(profile),
      followStatus: "FOLLOWING" as const,
      privacy: profile.privacy,
    }));

    const hasMore = profiles.length > pageSize;
    const nextCursor = hasMore
      ? {
          userId: profiles[pageSize - 1].userId,
          createdAt: profiles[pageSize - 1].followedAt,
        }
      : null;

    return ok({ items, nextCursor });
  }

  /**
   * Retrieves a paginated list of another user's followers.
   * Note: Ideally, followStatus should reflect the viewer's relationship, but viewer ID is not provided.
   */
  async paginateFollowersOthers({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<Result<PaginateResult, FollowErrors>> {
    // In a real system, followStatus should be computed based on the viewer's ID, not userId.
    const profiles = await this.followRepository.paginateFollowers({
      otherUserId: userId,
      cursor: cursor
        ? { createdAt: new Date(cursor.createdAt), userId: cursor.userId }
        : null,
      limit: pageSize + 1,
    });

    const items = await Promise.all(
      profiles.slice(0, pageSize).map(async (profile) => {
        const followStatus = await this.followRepository.getFollower({
          senderUserId: userId, // Should be viewer ID in a real implementation
          recipientUserId: profile.userId,
        });
        return {
          ...cloudfront.hydrateProfile(profile),
          followStatus: followStatus ? "FOLLOWING" : "NOT_FOLLOWING",
          privacy: profile.privacy,
        };
      }),
    );

    const hasMore = profiles.length > pageSize;
    const nextCursor = hasMore
      ? {
          userId: profiles[pageSize - 1].userId,
          createdAt: profiles[pageSize - 1].followedAt,
        }
      : null;

    return ok({ items, nextCursor });
  }

  /**
   * Retrieves a paginated list of users another user is following.
   * Note: Ideally, followStatus should reflect the viewer's relationship, but viewer ID is not provided.
   */
  async paginateFollowingOthers({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<Result<PaginateResult, FollowErrors>> {
    // In a real system, followStatus should be computed based on the viewer's ID.
    const profiles = await this.followRepository.paginateFollowing({
      otherUserId: userId,
      cursor: cursor
        ? { createdAt: new Date(cursor.createdAt), userId: cursor.userId }
        : null,
      limit: pageSize + 1,
    });

    const items = await Promise.all(
      profiles.slice(0, pageSize).map(async (profile) => {
        const followStatus = await this.followRepository.getFollower({
          senderUserId: userId, // Should be viewer ID in a real implementation
          recipientUserId: profile.userId,
        });
        return {
          ...cloudfront.hydrateProfile(profile),
          followStatus: followStatus ? "FOLLOWING" : "NOT_FOLLOWING",
          privacy: profile.privacy,
        };
      }),
    );

    const hasMore = profiles.length > pageSize;
    const nextCursor = hasMore
      ? {
          userId: profiles[pageSize - 1].userId,
          createdAt: profiles[pageSize - 1].followedAt,
        }
      : null;

    return ok({ items, nextCursor });
  }

  /**
   * Retrieves a paginated list of pending follow requests sent to the user.
   * followStatus is always "REQUESTED" for these users.
   */
  async paginateFollowRequests({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<Result<PaginateResult, FollowErrors>> {
    const profiles = await this.followRepository.paginateFollowRequests({
      otherUserId: userId,
      cursor: cursor
        ? { createdAt: new Date(cursor.createdAt), userId: cursor.userId }
        : null,
      limit: pageSize + 1,
    });

    const items = profiles.slice(0, pageSize).map((profile) => ({
      ...cloudfront.hydrateProfile(profile),
      followStatus: "REQUESTED" as const,
      privacy: profile.privacy,
    }));

    const hasMore = profiles.length > pageSize;
    const nextCursor = hasMore
      ? {
          userId: profiles[pageSize - 1].userId,
          createdAt: profiles[pageSize - 1].followedAt,
        }
      : null;

    return ok({ items, nextCursor });
  }
}
