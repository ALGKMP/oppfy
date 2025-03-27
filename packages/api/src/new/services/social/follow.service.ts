import { inject, injectable } from "inversify";
import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import { cloudfront } from "@oppfy/cloudfront"; // Assuming this is the correct import path
import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { FollowErrors } from "../../errors/social/follow.error";
import { UserErrors } from "../../errors/user/user.error";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  AcceptFollowRequestParams,
  CancelFollowRequestParams,
  DeclineFollowRequestParams,
  GetFollowersParams,
  GetFollowingParams,
  GetFollowRequestParams,
  GetFollowRequestsParams,
  GetFollowStatusParams,
  IFollowService,
  RemoveFollowerParams,
  RemoveFollowParams,
  SendFollowRequestParams,
} from "../../interfaces/services/social/follow.service.interface";
import type { Profile } from "../../models";

@injectable()
export class FollowService implements IFollowService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: IFollowRepository,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  // Hydration helper for profile data
  private hydrateFollowItem(profile: Profile) {
    const hydratedProfile = cloudfront.hydrateProfile(profile);
    return hydratedProfile;
  }

  async sendFollowRequest({
    senderId,
    recipientId,
  }: SendFollowRequestParams): Promise<
    Result<
      void,
      | FollowErrors.AlreadyFollowing
      | FollowErrors.RequestAlreadySent
      | FollowErrors.CannotFollowSelf
      | FollowErrors.FailedToSendRequest
      | UserErrors.UserNotFound
    >
  > {
    if (senderId === recipientId) {
      return err(new FollowErrors.CannotFollowSelf(senderId));
    }

    const recipient = await this.userRepository.getUser({
      userId: recipientId,
    });
    if (!recipient) {
      return err(new UserErrors.UserNotFound(recipientId));
    }

    await this.db.transaction(async (tx) => {
      const isFollowing = await this.followRepository.getFollower(
        { senderUserId: senderId, recipientUserId: recipientId },
        tx,
      );
      if (isFollowing) {
        throw new FollowErrors.AlreadyFollowing(senderId, recipientId);
      }

      const isRequested = await this.followRepository.getFollowRequest(
        { senderUserId: senderId, recipientUserId: recipientId },
        tx,
      );
      if (isRequested) {
        throw new FollowErrors.RequestAlreadySent(senderId, recipientId);
      }

      await this.followRepository.createFollowRequest(
        { senderUserId: senderId, recipientUserId: recipientId },
        tx,
      );
    });
    return ok(undefined);
  }

  async acceptFollowRequest({
    senderId,
    recipientId,
  }: AcceptFollowRequestParams): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToAcceptRequest
    >
  > {
    await this.db.transaction(async (tx) => {
      const isRequested = await this.followRepository.getFollowRequest(
        { senderUserId: senderId, recipientUserId: recipientId },
        tx,
      );
      if (!isRequested) {
        throw new FollowErrors.RequestNotFound(senderId, recipientId);
      }

      await this.followRepository.deleteFollowRequest(
        { senderUserId: senderId, recipientUserId: recipientId },
        tx,
      );
      await this.followRepository.createFollower(
        { senderUserId: senderId, recipientUserId: recipientId },
        tx,
      );
    });
    return ok(undefined);
  }

  async declineFollowRequest({
    senderId,
    recipientId,
  }: DeclineFollowRequestParams): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToDeclineRequest
    >
  > {
    const isRequested = await this.followRepository.getFollowRequest({
      senderUserId: senderId,
      recipientUserId: recipientId,
    });
    if (!isRequested) {
      return err(new FollowErrors.RequestNotFound(senderId, recipientId));
    }

    await this.followRepository.deleteFollowRequest({
      senderUserId: senderId,
      recipientUserId: recipientId,
    });
    return ok(undefined);
  }

  async removeFollow({
    followerId,
    followeeId,
  }: RemoveFollowParams): Promise<
    Result<void, FollowErrors.NotFollowing | FollowErrors.FailedToRemove>
  > {
    const isFollowing = await this.followRepository.getFollower({
      senderUserId: followerId,
      recipientUserId: followeeId,
    });
    if (!isFollowing) {
      return err(new FollowErrors.NotFollowing(followerId, followeeId));
    }

    await this.followRepository.deleteFollower({
      senderUserId: followerId,
      recipientUserId: followeeId,
    });
    return ok(undefined);
  }

  async getFollowRequest({
    senderId,
    recipientId,
  }: GetFollowRequestParams): Promise<
    Result<
      { senderId: string; recipientId: string; createdAt: Date } | undefined,
      never
    >
  > {
    const request = await this.db.query.followRequest.findFirst({
      where: (fr, { eq, and }) =>
        and(eq(fr.senderUserId, senderId), eq(fr.recipientUserId, recipientId)),
    });
    return ok(
      request
        ? { senderId, recipientId, createdAt: request.createdAt }
        : undefined,
    );
  }

  async getFollowers({
    userId,
    limit = 10,
    cursor,
  }: GetFollowersParams): Promise<
    Result<
      {
        items: Profile[];
        nextCursor?: string;
      },
      never
    >
  > {
    const profiles = await this.followRepository.paginateFollowers({
      otherUserId: userId,
      cursor: cursor ? { createdAt: new Date(cursor), userId: "" } : null,
      limit: limit + 1,
    });

    const items = profiles
      .slice(0, limit)
      .map((profile) => this.hydrateFollowItem(profile.profile));
    const nextCursor =
      profiles.length > limit && profiles[limit - 1]?.createdAt
        ? profiles[limit - 1]?.createdAt.toISOString()
        : undefined;

    return ok({ items, nextCursor });
  }

  async getFollowing({
    userId,
    limit = 10,
    cursor,
  }: GetFollowingParams): Promise<
    Result<
      {
        items: Profile[];
        nextCursor?: string;
      },
      never
    >
  > {
    const profiles = await this.followRepository.paginateFollowing({
      otherUserId: userId,
      cursor: cursor ? { createdAt: new Date(cursor), userId: "" } : null,
      limit: limit + 1,
    });

    const items = profiles
      .slice(0, limit)
      .map((profile) => this.hydrateFollowItem(profile.profile));
    const nextCursor =
      profiles.length > limit && profiles[limit - 1]?.createdAt
        ? profiles[limit - 1]?.createdAt.toISOString()
        : undefined;

    return ok({ items, nextCursor });
  }

  async getFollowRequests({
    userId,
    limit = 10,
    cursor,
  }: GetFollowRequestsParams): Promise<
    Result<
      {
        items: Profile[];
        nextCursor?: string;
      },
      never
    >
  > {
    const profiles = await this.followRepository.paginateFollowRequests({
      otherUserId: userId,
      cursor: cursor ? { createdAt: new Date(cursor), userId: "" } : null,
      limit: limit + 1,
    });

    const items = profiles.slice(0, limit).map((profile) => ({
      ...this.hydrateFollowItem(profile.profile),
      createdAt: profile.createdAt, // Fallback if missing
    }));
    const nextCursor =
      profiles.length > limit && profiles[limit - 1]?.createdAt
        ? profiles[limit - 1]?.createdAt.toISOString()
        : undefined;

    return ok({ items, nextCursor });
  }

  async getFollowStatus({
    userId,
    targetUserId,
  }: GetFollowStatusParams): Promise<
    Result<"following" | "requested" | "notFollowing", never>
  > {
    const isFollowing = await this.followRepository.getFollower({
      senderUserId: userId,
      recipientUserId: targetUserId,
    });
    if (isFollowing) {
      return ok("following");
    }

    const isRequested = await this.followRepository.getFollowRequest({
      senderUserId: userId,
      recipientUserId: targetUserId,
    });
    return ok(isRequested ? "requested" : "notFollowing");
  }

  async removeFollower({
    userId,
    followerToRemove,
  }: RemoveFollowerParams): Promise<
    Result<void, FollowErrors.NotFollowing | FollowErrors.FailedToRemove>
  > {
    const isFollowing = await this.followRepository.getFollower({
      senderUserId: followerToRemove,
      recipientUserId: userId,
    });
    if (!isFollowing) {
      return err(new FollowErrors.NotFollowing(followerToRemove, userId));
    }

    await this.followRepository.deleteFollower({
      senderUserId: followerToRemove,
      recipientUserId: userId,
    });
    return ok(undefined);
  }

  async cancelFollowRequest({
    senderId,
    recipientId,
  }: CancelFollowRequestParams): Promise<
    Result<
      void,
      FollowErrors.RequestNotFound | FollowErrors.FailedToDeclineRequest
    >
  > {
    const isRequested = await this.followRepository.getFollowRequest({
      senderUserId: senderId,
      recipientUserId: recipientId,
    });
    if (!isRequested) {
      return err(new FollowErrors.RequestNotFound(senderId, recipientId));
    }

    await this.followRepository.deleteFollowRequest({
      senderUserId: senderId,
      recipientUserId: recipientId,
    });
    return ok(undefined);
  }
}
