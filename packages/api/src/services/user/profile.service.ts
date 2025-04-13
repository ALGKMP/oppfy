import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront, Hydrate } from "@oppfy/cloudfront";
import { FollowStatus, FriendStatus } from "@oppfy/db/utils/query-helpers";
import { env } from "@oppfy/env";
import { S3 } from "@oppfy/s3";

import * as ProfileErrors from "../../errors/user/profile.error";
import {
  SelfOtherUserIdsParams,
  UserIdParam,
  UsernameParam,
} from "../../interfaces/types";
import { Profile, ProfileInsert, UserStats } from "../../models";
import { BlockRepository } from "../../repositories/social/block.repository";
import { FollowRepository } from "../../repositories/social/follow.repository";
import { FriendRepository } from "../../repositories/social/friend.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { TYPES } from "../../symbols";

interface RelationshipState {
  follow: FollowStatus;
  friend: FriendStatus;
  isBlocked: boolean;
}

interface SearchProfilesByUsernameParams {
  userId: string;
  username: string;
}

interface UpdateProfileParams {
  userId: string;
  update: Partial<ProfileInsert>;
}

interface GenerateProfilePicturePresignedUrlParams {
  userId: string;
  contentLength: number;
}

@injectable()
export class ProfileService {
  constructor(
    @inject(TYPES.S3)
    private readonly s3: S3,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: FollowRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: FriendRepository,
    @inject(TYPES.BlockRepository)
    private readonly blockRepository: BlockRepository,
  ) {}

  /**
   * Retrieves a user's profile, ensuring access control with privacy and block checks.
   */
  async profile({
    selfUserId,
    otherUserId,
  }: SelfOtherUserIdsParams<"optional">): Promise<
    Result<
      Hydrate<Profile>,
      | ProfileErrors.ProfileBlocked
      | ProfileErrors.ProfileNotFound
      | ProfileErrors.ProfilePrivate
    >
  > {
    if (otherUserId) {
      const isBlocked = await this.blockRepository.getBlock({
        senderUserId: selfUserId,
        recipientUserId: otherUserId,
      });

      if (isBlocked) {
        return err(new ProfileErrors.ProfileBlocked(otherUserId));
      }
    }

    // Fetch the profile
    const profileData = await this.profileRepository.getProfile({
      userId: otherUserId ?? selfUserId,
    });

    if (profileData === undefined) {
      return err(new ProfileErrors.ProfileNotFound(otherUserId ?? selfUserId));
    }

    // Check privacy settings if its another profile
    if (otherUserId && profileData.privacy === "private") {
      const isFollowing = await this.followRepository.getFollower({
        senderUserId: otherUserId,
        recipientUserId: selfUserId,
      });

      if (!isFollowing) {
        return err(new ProfileErrors.ProfilePrivate(otherUserId));
      }
    }

    return ok(this.cloudfront.hydrateProfile(profileData));
  }

  /**
   * Retrieves a profile by username for site display.
   */
  async profileForSite(
    params: UsernameParam,
  ): Promise<Result<Hydrate<Profile>, ProfileErrors.ProfileNotFound>> {
    const { username } = params;

    const profileData = await this.profileRepository.getProfileByUsername({
      username,
    });

    if (profileData === undefined) {
      return err(new ProfileErrors.ProfileNotFound(username));
    }

    return ok(this.cloudfront.hydrateProfile(profileData));
  }

  /**
   * Searches profiles by username, filtering by blocked status and onboarding completion.
   */
  async searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<Result<Hydrate<Profile>[], never>> {
    const profiles = await this.profileRepository.getProfilesByUsername(params);
    const hydratedProfiles = profiles.map((profile) =>
      this.cloudfront.hydrateProfile(profile),
    );

    return ok(hydratedProfiles);
  }

  /**
   * Determines relationship states (follow/friend) between users, considering blocks.
   */
  async relationshipStatesBetweenUsers(
    params: SelfOtherUserIdsParams,
  ): Promise<
    Result<
      RelationshipState,
      | ProfileErrors.ProfileBlocked
      | ProfileErrors.CannotCheckRelationshipWithSelf
    >
  > {
    const { selfUserId, otherUserId } = params;

    if (selfUserId === otherUserId) {
      return err(new ProfileErrors.CannotCheckRelationshipWithSelf());
    }

    const isBlockedOutgoing = await this.blockRepository.getBlock({
      senderUserId: selfUserId,
      recipientUserId: otherUserId,
    });

    const isBlockedIncoming = await this.blockRepository.getBlock({
      senderUserId: otherUserId,
      recipientUserId: selfUserId,
    });

    if (isBlockedIncoming) {
      return ok({
        follow: "NOT_FOLLOWING",
        friend: "NOT_FRIENDS",
        isBlocked: true,
      });
    }

    const [isFollowing, isFollowRequested, isFriends, isFriendRequested] =
      await Promise.all([
        this.followRepository.getFollower({
          senderUserId: selfUserId,
          recipientUserId: otherUserId,
        }),
        this.followRepository.getFollowRequest({
          senderUserId: selfUserId,
          recipientUserId: otherUserId,
        }),
        this.friendRepository.getFriendRequest({
          senderUserId: selfUserId,
          recipientUserId: otherUserId,
        }),
        this.friendRepository.getFriendRequest({
          senderUserId: selfUserId,
          recipientUserId: otherUserId,
        }),
        this.profileRepository.getPrivacy({
          userId: otherUserId,
        }),
      ]);

    const followState = (
      isFollowing
        ? "FOLLOWING"
        : isFollowRequested
          ? "REQUESTED"
          : "NOT_FOLLOWING"
    ) satisfies FollowStatus;

    const friendState = (
      isFriends ? "FRIENDS" : isFriendRequested ? "REQUESTED" : "NOT_FRIENDS"
    ) satisfies FriendStatus;

    return ok({
      follow: followState,
      friend: friendState,
      isBlocked: isBlockedOutgoing != undefined,
    });
  }

  /**
   * Retrieves user stats, ensuring the requester is not blocked.
   */
  async stats(
    params: SelfOtherUserIdsParams<"optional">,
  ): Promise<
    Result<
      UserStats,
      ProfileErrors.ProfileBlocked | ProfileErrors.StatsNotFound
    >
  > {
    const { selfUserId, otherUserId } = params;

    if (otherUserId) {
      const isBlocked = await this.blockRepository.getBlock({
        senderUserId: selfUserId,
        recipientUserId: otherUserId,
      });

      if (isBlocked) return err(new ProfileErrors.ProfileBlocked(otherUserId));
    }

    const stats = await this.profileRepository.getStats({
      userId: otherUserId ?? selfUserId,
    });

    if (stats === undefined) {
      return err(new ProfileErrors.StatsNotFound(otherUserId ?? selfUserId));
    }

    return ok(stats);
  }

  /**
   * Retrieves a user's privacy settings.
   */
  async privacy(
    params: UserIdParam,
  ): Promise<Result<Profile["privacy"], ProfileErrors.ProfileNotFound>> {
    const privacy = await this.profileRepository.getPrivacy({
      userId: params.userId,
    });

    if (privacy === undefined)
      return err(new ProfileErrors.ProfileNotFound(params.userId));

    return ok(privacy);
  }

  /**
   * Updates a user's profile, restricted to the profile owner.
   */
  async updateProfile(
    params: UpdateProfileParams,
  ): Promise<Result<void, never>> {
    const { userId, update } = params;

    await this.profileRepository.updateProfile({
      userId,
      update,
    });

    return ok();
  }

  /**
   * Generates a presigned URL for profile picture upload, restricted to the owner.
   */
  async generateProfilePicturePresignedUrl(
    params: GenerateProfilePicturePresignedUrlParams,
  ): Promise<Result<string, never>> {
    const { userId, contentLength } = params;

    const presignedUrl = await this.s3.createProfilePicturePresignedUrl({
      userId,
      contentLength,
    });

    const key = `/profile-pictures/${userId}.jpg`;

    await this.cloudfront.createInvalidation(
      env.CLOUDFRONT_PROFILE_PICTURE_DISTRIBUTION_ID,
      key,
    );

    await this.profileRepository.updateProfile({
      userId,
      update: {
        profilePictureKey: key,
      },
    });

    return ok(presignedUrl);
  }
}
