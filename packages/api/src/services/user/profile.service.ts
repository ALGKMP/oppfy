import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront, Hydrate } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import {
  FollowStatus,
  FriendStatus,
  Privacy,
} from "@oppfy/db/utils/query-helpers";
import { env } from "@oppfy/env";
import { S3 } from "@oppfy/s3";

import * as ProfileErrors from "../../errors/user/profile.error";
import { Profile, ProfileInsert, UserStats } from "../../models";
import { BlockRepository } from "../../repositories/social/block.repository";
import { FollowRepository } from "../../repositories/social/follow.repository";
import { FriendRepository } from "../../repositories/social/friend.repository";
import { ProfileRepository } from "../../repositories/user/profile.repository";
import { TYPES } from "../../symbols";
import {
  SelfOtherUserIdsParams,
  UserIdParam,
  UsernameParam,
} from "../../types";

interface RelationshipState {
  follow: FollowStatus;
  friend: FriendStatus;
  privacy: Privacy;
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
    @inject(TYPES.Database)
    private readonly database: Database,
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
  async getProfile({
    selfUserId,
    otherUserId,
  }: SelfOtherUserIdsParams<"optional">): Promise<
    Result<
      Hydrate<Profile<"notOnApp"> | Profile<"onboarded">>,
      ProfileErrors.ProfileBlocked | ProfileErrors.ProfileNotFound
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
  ): Promise<
    Result<Hydrate<Profile<"notOnApp"> | Profile<"onboarded">>[], never>
  > {
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
      | ProfileErrors.ProfileNotFound
      | ProfileErrors.ProfileBlocked
      | ProfileErrors.CannotCheckRelationshipWithSelf
    >
  > {
    const { selfUserId, otherUserId } = params;

    if (selfUserId === otherUserId) {
      return err(new ProfileErrors.CannotCheckRelationshipWithSelf());
    }

    const [isBlockedOutgoing, isBlockedIncoming, privacy] = await Promise.all([
      this.blockRepository.getBlock({
        senderUserId: selfUserId,
        recipientUserId: otherUserId,
      }),
      this.blockRepository.getBlock({
        senderUserId: otherUserId,
        recipientUserId: selfUserId,
      }),
      this.profileRepository.getPrivacy({
        userId: otherUserId,
      }),
    ]);

    if (privacy === undefined) {
      return err(new ProfileErrors.ProfileNotFound(otherUserId));
    }

    if (isBlockedIncoming) {
      return ok({
        follow: "NOT_FOLLOWING",
        friend: "NOT_FRIENDS",
        privacy: privacy === "private" ? "PRIVATE" : "PUBLIC",
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
        this.friendRepository.getFriend({
          userIdA: selfUserId,
          userIdB: otherUserId,
        }),
        this.friendRepository.getFriendRequest({
          senderUserId: selfUserId,
          recipientUserId: otherUserId,
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
      privacy: privacy === "private" ? "PRIVATE" : "PUBLIC",
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
  async generateProfilePicturePresignedUrl({
    userId,
    contentLength,
  }: GenerateProfilePicturePresignedUrlParams): Promise<Result<string, never>> {
    return await this.database.transaction(async (tx) => {
      const key = `profile-pictures/${userId}.jpg`;

      await this.profileRepository.updateProfile(
        {
          userId,
          update: {
            profilePictureKey: key,
          },
        },
        tx,
      );

      const presignedUrl = await this.s3.createProfilePicturePresignedUrl({
        key,
        contentLength,
        contentType: "image/jpeg",
        metadata: {
          user: userId,
        },
      });

      await this.cloudfront.invalidateProfilePicture(key);

      return ok(presignedUrl);
    });
  }
}
