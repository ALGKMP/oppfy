import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront, Hydrate } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { FollowStatus } from "@oppfy/db/utils/query-helpers";

import * as FollowErrors from "../../errors/social/follow.error";
import * as FriendErrors from "../../errors/social/friend.error";
import * as ProfileErrors from "../../errors/user/profile.error";
import { Profile } from "../../models";
import { FollowRepository } from "../../repositories/social/follow.repository";
import { FriendRepository } from "../../repositories/social/friend.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { TYPES } from "../../symbols";
import {
  DirectionalUserIdsParams,
  PaginatedResponse,
  PaginationParams,
  SelfOtherUserIdsParams,
} from "../../types";

interface PaginateByUserIdWithSelfUserIdParams extends PaginationParams {
  selfUserId: string;
  userId: string;
}

interface PaginateByUserIdParams extends PaginationParams {
  userId: string;
}

@injectable()
export class FollowService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: FollowRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: FriendRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
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
      const [isFollowing, isRequested] = await Promise.all([
        this.followRepository.getFollower(
          { senderUserId, recipientUserId },
          tx,
        ),
        this.followRepository.getFollowRequest(
          { senderUserId, recipientUserId },
          tx,
        ),
      ]);

      // Check if the user is already following the recipient
      if (isFollowing)
        return err(
          new FollowErrors.AlreadyFollowing(senderUserId, recipientUserId),
        );

      // Check if a follow request is already pending
      if (isRequested)
        return err(
          new FollowErrors.RequestAlreadySent(senderUserId, recipientUserId),
        );

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
   * Allows a user to unfollow another user by removing the follower relationship, if it exists.
   */
  async unfollowUser({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, FollowErrors.NotFollowing | FriendErrors.MustUnfriendFirst>
  > {
    await this.db.transaction(async (tx) => {
      const [isFollowing, isFriends] = await Promise.all([
        this.followRepository.getFollower(
          { senderUserId, recipientUserId },
          tx,
        ),
        this.friendRepository.getFriendRequest(
          { senderUserId, recipientUserId },
          tx,
        ),
      ]);

      // If the user is not following the recipient, return an error
      if (!isFollowing)
        return err(
          new FollowErrors.NotFollowing(senderUserId, recipientUserId),
        );

      // If the user is friends with the recipient, they must unfriend first
      if (isFriends)
        return err(
          new FriendErrors.MustUnfriendFirst(senderUserId, recipientUserId),
        );

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
  }: DirectionalUserIdsParams): Promise<
    Result<void, FollowErrors.NotFollowing>
  > {
    await this.db.transaction(async (tx) => {
      const [
        isFollowing,
        isFriends,
        isFriendRequestedIncoming,
        isFriendRequestedOutgoing,
      ] = await Promise.all([
        this.followRepository.getFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        ),
        this.friendRepository.getFriend(
          {
            userIdA: recipientUserId,
            userIdB: senderUserId,
          },
          tx,
        ),
        this.friendRepository.getFriendRequest(
          {
            senderUserId: recipientUserId,
            recipientUserId: senderUserId,
          },
          tx,
        ),
        this.friendRepository.getFriendRequest(
          {
            senderUserId: senderUserId,
            recipientUserId: recipientUserId,
          },
          tx,
        ),
      ]);

      if (!isFollowing)
        return err(
          new FollowErrors.NotFollowing(senderUserId, recipientUserId),
        );

      if (isFriends) {
        await this.friendRepository.deleteFriend(
          {
            userIdA: recipientUserId,
            userIdB: senderUserId,
          },
          tx,
        );
      }

      if (isFriendRequestedIncoming) {
        await this.friendRepository.deleteFriendRequest(
          {
            senderUserId: recipientUserId,
            recipientUserId: senderUserId,
          },
          tx,
        );
      }

      if (isFriendRequestedOutgoing) {
        await this.friendRepository.deleteFriendRequest(
          {
            senderUserId: senderUserId,
            recipientUserId: recipientUserId,
          },
          tx,
        );
      }

      await this.followRepository.deleteFollower(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );
    });

    return ok();
  }

  /**
   * Accepts a pending follow request, creating a follower relationship.
   * senderUserId is the user accepting (recipient of the request), recipientUserId is the requester.
   */
  async acceptFollowRequest({
    selfUserId,
    otherUserId,
  }: SelfOtherUserIdsParams): Promise<
    Result<void, FollowErrors.RequestNotFound>
  > {
    await this.db.transaction(async (tx) => {
      const isRequested = await this.followRepository.getFollowRequest(
        { senderUserId: otherUserId, recipientUserId: selfUserId },
        tx,
      );
      if (!isRequested)
        return err(new FollowErrors.RequestNotFound(selfUserId, otherUserId));

      await Promise.all([
        this.followRepository.deleteFollowRequest(
          { senderUserId: otherUserId, recipientUserId: selfUserId },
          tx,
        ),
        this.followRepository.createFollower(
          { senderUserId: otherUserId, recipientUserId: selfUserId },
          tx,
        ),
      ]);
    });

    return ok();
  }

  /**
   * Declines a pending follow request.
   * senderUserId is the user declining (recipient of the request), recipientUserId is the requester.
   */
  async declineFollowRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, FollowErrors.RequestNotFound>
  > {
    await this.db.transaction(async (tx) => {
      const isRequested = await this.followRepository.getFollowRequest(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );
      if (!isRequested)
        return err(
          new FollowErrors.RequestNotFound(recipientUserId, senderUserId),
        );

      await this.followRepository.deleteFollowRequest(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );
    });

    return ok();
  }

  /**
   * Cancels a user's own pending follow request.
   * senderUserId is the user canceling (sender of the request), recipientUserId is the target.
   */
  async cancelFollowRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, FollowErrors.RequestNotFound>
  > {
    await this.db.transaction(async (tx) => {
      const isRequested = await this.followRepository.getFollowRequest(
        { senderUserId, recipientUserId },
        tx,
      );
      if (!isRequested)
        return err(
          new FollowErrors.RequestNotFound(senderUserId, recipientUserId),
        );

      await this.followRepository.deleteFollowRequest(
        { senderUserId, recipientUserId },
        tx,
      );
    });
    return ok();
  }

  /**
   * Retrieves a paginated list of the user's followers.
   * For each follower, followStatus indicates if the user follows them back.
   */
  async paginateFollowers({
    userId,
    cursor,
    pageSize = 10,
    selfUserId,
  }: PaginateByUserIdWithSelfUserIdParams): Promise<
    Result<
      PaginatedResponse<
        Hydrate<Profile<"onboarded">> & { followStatus: FollowStatus }
      >,
      never
    >
  > {
    const rawProfiles = await this.followRepository.paginateFollowers({
      userId,
      cursor,
      pageSize: pageSize + 1,
      selfUserId,
    });

    const hydratedProfiles = rawProfiles.map((profile) => ({
      ...this.cloudfront.hydrateProfile(profile),
      followStatus: profile.followStatus,
    }));

    const hasMore = rawProfiles.length > pageSize;
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

  /**
   * Retrieves a paginated list of users the specified user is following.
   * followStatus is always "FOLLOWING" since these are users the user follows.
   */
  async paginateFollowing({
    userId,
    cursor,
    pageSize = 10,
    selfUserId,
  }: PaginateByUserIdWithSelfUserIdParams): Promise<
    Result<
      PaginatedResponse<
        Hydrate<Profile<"onboarded">> & { followStatus: FollowStatus }
      >,
      never
    >
  > {
    const rawProfiles = await this.followRepository.paginateFollowing({
      userId,
      cursor,
      pageSize: pageSize + 1,
      selfUserId,
    });

    const hydratedProfiles = rawProfiles.map((profile) => ({
      ...this.cloudfront.hydrateProfile(profile),
      followStatus: profile.followStatus,
    }));

    const hasMore = rawProfiles.length > pageSize;
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

  /**
   * Retrieves a paginated list of pending follow requests sent to the user.
   */
  async paginateFollowRequests({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<
    Result<PaginatedResponse<Hydrate<Profile<"onboarded">>>, never>
  > {
    const rawProfiles = await this.followRepository.paginateFollowRequests({
      userId,
      cursor,
      pageSize: pageSize + 1,
    });

    const hydratedProfiles = rawProfiles.map((profile) =>
      this.cloudfront.hydrateProfile(profile),
    );

    const hasMore = rawProfiles.length > pageSize;
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
