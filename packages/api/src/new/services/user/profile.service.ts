import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import { CloudFront } from "@oppfy/cloudfront";
import type { Database } from "@oppfy/db";
import { S3 } from "@oppfy/s3";

import { TYPES } from "../../container";
import { ProfileError, ProfileErrors } from "../../errors/user/profile.error";
import type { IBlockRepository } from "../../interfaces/repositories/social/block.repository.interface";
import type { IFollowRepository } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IFriendRepository } from "../../interfaces/repositories/social/friend.repository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profile.repository.interface";
import type {
  FollowRelationshipState,
  FriendRelationshipState,
  GenerateProfilePicturePresignedUrlParams,
  GetStatsParams,
  IProfileService,
  ProfileForSiteParams,
  ProfileParams,
  RelationshipState,
  RelationshipStatesBetweenUsersParams,
  SearchProfilesByUsernameParams,
  UpdateProfileParams,
} from "../../interfaces/services/user/profile.service.interface";
import { HydratedProfile, UserStats } from "../../models";

@injectable()
export class ProfileService implements IProfileService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.S3)
    private readonly s3: S3,
    @inject(TYPES.CloudFront)
    private readonly cloudfront: CloudFront,
    @inject(TYPES.ProfileRepository)
    private readonly profileRepository: IProfileRepository,
    @inject(TYPES.FollowRepository)
    private readonly followRepository: IFollowRepository,
    @inject(TYPES.FriendRepository)
    private readonly friendRepository: IFriendRepository,
    @inject(TYPES.BlockRepository)
    private readonly blockRepository: IBlockRepository,
  ) {}

  /**
   * Retrieves a user's profile, ensuring access control with privacy and block checks.
   */
  async profile(
    params: ProfileParams,
  ): Promise<Result<HydratedProfile, ProfileError>> {
    const { selfUserId, otherUserId } = params;

    const isBlocked = await this.blockRepository.isBlocked({
      userId: selfUserId,
      blockedUserId: otherUserId,
    });

    if (isBlocked) {
      return err(new ProfileErrors.ProfileBlocked(otherUserId));
    }

    // Fetch the profile
    const profileData = await this.profileRepository.getProfile({
      userId: otherUserId,
    });

    if (profileData === undefined) {
      return err(new ProfileErrors.ProfileNotFound(otherUserId));
    }

    // Check privacy settings
    if (profileData.privacy === "private") {
      const isFollowing = await this.followRepository.isFollowing({
        senderId: selfUserId,
        recipientId: otherUserId,
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
    params: ProfileForSiteParams,
  ): Promise<Result<HydratedProfile, ProfileError>> {
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
  ): Promise<Result<HydratedProfile[], never>> {
    const { username, selfUserId } = params;

    const profiles = await this.profileRepository.getProfilesByUsername({
      username,
      selfUserId,
    });

    return ok(
      profiles.map((profile) => this.cloudfront.hydrateProfile(profile)),
    );
  }

  /**
   * Determines relationship states (follow/friend) between users, considering blocks.
   */
  async relationshipStatesBetweenUsers(
    params: RelationshipStatesBetweenUsersParams,
  ): Promise<Result<RelationshipState[], never>> {
    const { currentUserId, otherUserId } = params;

    const isBlocked = await this.blockRepository.isBlocked({
      userId: currentUserId,
      blockedUserId: otherUserId,
    });

    if (isBlocked) {
      return ok([{ follow: "NOT_FOLLOWING", friend: "NOT_FRIENDS" }]);
    }

    const [isFollowing, isFollowRequested, isFriends, isFriendRequested] =
      await Promise.all([
        this.followRepository.isFollowing({
          senderId: currentUserId,
          recipientId: otherUserId,
        }),
        this.followRepository.isFollowRequested({
          senderId: currentUserId,
          recipientId: otherUserId,
        }),
        this.friendRepository.isFriends({
          userIdA: currentUserId,
          userIdB: otherUserId,
        }),
        this.friendRepository.isFriendRequested({
          senderId: currentUserId,
          recipientId: otherUserId,
        }),
      ]);

    const followState = (
      isFollowing
        ? "FOLLOWING"
        : isFollowRequested
          ? "FOLLOW_REQUEST_SENT"
          : "NOT_FOLLOWING"
    ) satisfies FollowRelationshipState;

    const friendState = (
      isFriends
        ? "FRIENDS"
        : isFriendRequested
          ? "FRIEND_REQUEST_SENT"
          : "NOT_FRIENDS"
    ) satisfies FriendRelationshipState;

    return ok([{ follow: followState, friend: friendState }]);
  }

  stats(params: GetStatsParams): Promise<Result<UserStats, ProfileError>> {
    throw new Error("Method not implemented.");
  }
  updateProfile(
    params: UpdateProfileParams,
  ): Promise<Result<void, ProfileError>> {
    throw new Error("Method not implemented.");
  }
  generateProfilePicturePresignedUrl(
    params: GenerateProfilePicturePresignedUrlParams,
  ): Promise<Result<string, ProfileError>> {
    throw new Error("Method not implemented.");
  }
}
