import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import * as FriendErrors from "../../errors/social/friend.error";
import { UserNotFound } from "../../errors/user/user.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type {
  IFriendRepository,
  SocialProfile,
} from "../../interfaces/repositories/social/friend.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  IFriendService,
  PaginateByUserIdParams,
} from "../../interfaces/services/social/friend.service.interface";
import {
  BidirectionalUserIdsparams,
  DirectionalUserIdsParams,
  PaginatedResponse,
} from "../../interfaces/types";
import { Profile } from "../../models";

@injectable()
export class FriendService implements IFriendService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: IFollowRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
  ) {}

  /**
   * Initiates or completes a friend relationship. Sends a friend request if no prior relationship exists,
   * or accepts an incoming request if one is present.
   */
  async friendUser({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<
      void,
      | FriendErrors.CannotFriendSelf
      | FriendErrors.AlreadyFriends
      | FriendErrors.RequestAlreadySent
    >
  > {
    if (senderUserId === recipientUserId) {
      return err(new FriendErrors.CannotFriendSelf(senderUserId));
    }

    const [senderExists, recipientProfile] = await Promise.all([
      this.userRepository.getUser({ userId: senderUserId }),
      this.profileRepository.getProfile({ userId: recipientUserId }),
    ]);
    if (!senderExists) return err(new UserNotFound(senderUserId));
    if (!recipientProfile) return err(new UserNotFound(recipientUserId));

    return await this.db.transaction(async (tx) => {
      const [
        isFriends,
        isFriendRequestedOutgoing,
        isFriendRequestedIncoming,
        isFollowing,
        isFollowRequested,
        isRecipientFollowing,
        isRecipientFollowRequested,
      ] = await Promise.all([
        this.friendRepository.getFriend(
          { userIdA: senderUserId, userIdB: recipientUserId },
          tx,
        ),
        this.friendRepository.getFriendRequest(
          { senderUserId, recipientUserId },
          tx,
        ),
        this.friendRepository.getFriendRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        ),
        this.followRepository.getFollower(
          { senderUserId, recipientUserId },
          tx,
        ),
        this.followRepository.getFollowRequest(
          { senderUserId, recipientUserId },
          tx,
        ),
        this.followRepository.getFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        ),
        this.followRepository.getFollowRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        ),
      ]);

      if (isFriends) {
        return err(
          new FriendErrors.AlreadyFriends(senderUserId, recipientUserId),
        );
      }
      if (isFriendRequestedOutgoing) {
        return err(
          new FriendErrors.RequestAlreadySent(senderUserId, recipientUserId),
        );
      }

      if (isFriendRequestedIncoming) {
        await this.friendRepository.createFriend(
          { userIdA: senderUserId, userIdB: recipientUserId },
          tx,
        );
        await this.friendRepository.deleteFriendRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );

        if (isFollowRequested) {
          await this.followRepository.deleteFollowRequest(
            { senderUserId, recipientUserId },
            tx,
          );
        }
        if (isRecipientFollowRequested) {
          await this.followRepository.deleteFollowRequest(
            { senderUserId: recipientUserId, recipientUserId: senderUserId },
            tx,
          );
        }
        if (!isFollowing) {
          await this.followRepository.createFollower(
            { senderUserId, recipientUserId },
            tx,
          );
        }
        if (!isRecipientFollowing) {
          await this.followRepository.createFollower(
            { senderUserId: recipientUserId, recipientUserId: senderUserId },
            tx,
          );
        }

        return ok();
      }

      await this.friendRepository.createFriendRequest(
        { senderUserId, recipientUserId },
        tx,
      );

      if (!isFollowing && !isFollowRequested) {
        await this.followRepository[
          recipientProfile.privacy === "public"
            ? "createFollower"
            : "createFollowRequest"
        ]({ senderUserId, recipientUserId }, tx);
      }
      if (isRecipientFollowRequested) {
        await this.followRepository.deleteFollowRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
        await this.followRepository.createFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
      }

      return ok();
    });
  }

  /**
   * Removes the friend relationship between two users. Follows persist.
   */
  async unfriendUser({
    userIdA,
    userIdB,
  }: BidirectionalUserIdsparams): Promise<Result<void, FriendErrors.NotFound>> {
    return await this.db.transaction(async (tx) => {
      const isFriends = await this.friendRepository.getFriend(
        { userIdA, userIdB },
        tx,
      );
      if (!isFriends) {
        return err(new FriendErrors.NotFound(userIdA, userIdB));
      }

      await this.friendRepository.deleteFriend({ userIdA, userIdB }, tx);

      return ok();
    });
  }

  /**
   * Accepts an incoming friend request, establishing a friendship and ensuring mutual follows.
   */
  async acceptFriendRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, FriendErrors.RequestNotFound>
  > {
    return await this.db.transaction(async (tx) => {
      const isRequested = await this.friendRepository.getFriendRequest(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );
      if (!isRequested) {
        return err(
          new FriendErrors.RequestNotFound(recipientUserId, senderUserId),
        );
      }

      await this.friendRepository.deleteFriendRequest(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );
      await this.friendRepository.createFriend(
        { userIdA: senderUserId, userIdB: recipientUserId },
        tx,
      );

      const [isFollowRequested, isRecipientFollowRequested] = await Promise.all(
        [
          this.followRepository.getFollowRequest(
            { senderUserId, recipientUserId },
            tx,
          ),
          this.followRepository.getFollowRequest(
            { senderUserId: recipientUserId, recipientUserId: senderUserId },
            tx,
          ),
        ],
      );
      if (isFollowRequested) {
        await this.followRepository.deleteFollowRequest(
          { senderUserId, recipientUserId },
          tx,
        );
      }
      if (isRecipientFollowRequested) {
        await this.followRepository.deleteFollowRequest(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
      }

      const [isFollowing, isRecipientFollowing] = await Promise.all([
        this.followRepository.getFollower(
          { senderUserId, recipientUserId },
          tx,
        ),
        this.followRepository.getFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        ),
      ]);
      if (!isFollowing) {
        await this.followRepository.createFollower(
          { senderUserId, recipientUserId },
          tx,
        );
      }
      if (!isRecipientFollowing) {
        await this.followRepository.createFollower(
          { senderUserId: recipientUserId, recipientUserId: senderUserId },
          tx,
        );
      }

      return ok();
    });
  }

  /**
   * Declines an incoming friend request by deleting it.
   */
  async declineFriendRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, FriendErrors.RequestNotFound>
  > {
    return await this.db.transaction(async (tx) => {
      const isRequested = await this.friendRepository.getFriendRequest(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );
      if (!isRequested) {
        return err(
          new FriendErrors.RequestNotFound(recipientUserId, senderUserId),
        );
      }

      await this.friendRepository.deleteFriendRequest(
        { senderUserId: recipientUserId, recipientUserId: senderUserId },
        tx,
      );

      return ok();
    });
  }

  /**
   * Cancels an outgoing friend request sent by the user.
   */
  async cancelFriendRequest({
    senderUserId,
    recipientUserId,
  }: DirectionalUserIdsParams): Promise<
    Result<void, FriendErrors.RequestNotFound>
  > {
    return await this.db.transaction(async (tx) => {
      const isRequested = await this.friendRepository.getFriendRequest(
        { senderUserId, recipientUserId },
        tx,
      );
      if (!isRequested) {
        return err(
          new FriendErrors.RequestNotFound(senderUserId, recipientUserId),
        );
      }

      await this.friendRepository.deleteFriendRequest(
        { senderUserId, recipientUserId },
        tx,
      );

      return ok();
    });
  }

  /**
   * Retrieves a paginated list of the user's friends.
   */
  async paginateFriends({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<
    Result<PaginatedResponse<SocialProfile>, never>
  > {
    const rawProfiles = await this.friendRepository.paginateFriends({
      userId,
      cursor,
      pageSize: pageSize + 1,
    });

    const hydratedProfiles = rawProfiles.map((profile) => ({
      ...this.cloudfront.hydrateProfile(profile),
      followedAt: profile.followedAt,
      friendedAt: profile.friendedAt,
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
   * Retrieves a paginated list of incoming friend requests.
   */
  async paginateFriendRequests({
    userId,
    cursor,
    pageSize = 10,
  }: PaginateByUserIdParams): Promise<
    Result<PaginatedResponse<Profile>, never>
  > {
    const rawProfiles = await this.friendRepository.paginateFriendRequests({
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
