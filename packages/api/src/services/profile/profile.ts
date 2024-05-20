import type { z } from "zod";

import { trpcValidators } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { S3Repository } from "../../repositories/aws/s3";
import { FollowRepository } from "../../repositories/network/follow";
import { FriendRepository } from "../../repositories/network/friend";
import { ProfileRepository } from "../../repositories/profile/profile";
import { BlockRepository } from "../../repositories/user/block";
import { UserRepository } from "../../repositories/user/user";
import { FriendService } from "../network/friend";

type UpdateProfile = z.infer<typeof trpcValidators.input.profile.updateProfile>;

type PublicFollowState = "NotFollowing" | "Following";
type PrivateFollowState = "NotFollowing" | "Requested" | "Following";
type FriendState = "NotFriends" | "Requested" | "Friends";

type PublicProfileStatus = {
  privacy: "public";
  followState: PublicFollowState;
  friendState: FriendState;
};

type PrivateProfileStatus = {
  privacy: "private";
  followState: PrivateFollowState;
  friendState: FriendState;
};

type ProfileStatus = PublicProfileStatus | PrivateProfileStatus;

interface ProfileData {
  name: string;
  username: string;
  bio: string | null;
  userId: string;
  profilePictureUrl: string;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  profileStatus: ProfileStatus;
  blocked: boolean;
}

export class ProfileService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();
  private s3Repository = new S3Repository();
  private followRepository = new FollowRepository();
  private friendsRepository = new FriendRepository();
  private blockRepository = new BlockRepository();

  private friendService = new FriendService();

  async updateFullName(userId: string, fullName: string) {
    const profile = await this._getUserProfile(userId);
    return await this.profileRepository.updateFullName(profile.id, fullName);
  }

  async updateDateOfBirth(userId: string, dateOfBirth: Date) {
    const profile = await this._getUserProfile(userId);
    await this.profileRepository.updateDateOfBirth(profile.id, dateOfBirth);
  }

  async updateBio(userId: string, bio: string) {
    const profile = await this._getUserProfile(userId);
    await this.profileRepository.updateBio(profile.id, bio);
  }

  async updateUsername(userId: string, newUsername: string) {
    const profile = await this._getUserProfile(userId);
    if (profile.username === newUsername) {
      return;
    }
    const usernameExists =
      await this.profileRepository.usernameExists(newUsername);
    if (usernameExists) {
      console.error(`SERVICE ERROR: username "${newUsername}" already exists`);
      throw new DomainError(
        ErrorCode.USERNAME_ALREADY_EXISTS,
        "The provided username already exists.",
      );
    }
    await this.profileRepository.updateUsername(profile.id, newUsername);
  }

  async updateProfile(userId: string, updates: UpdateProfile): Promise<void> {
    const profile = await this._getUserProfile(userId);

    const updateData: Partial<UpdateProfile> = {};
    if (updates.fullName !== undefined) {
      updateData.fullName = updates.fullName;
    }
    if (updates.bio !== undefined) {
      updateData.bio = updates.bio;
    }
    if (updates.username !== undefined) {
      const usernameExists = await this.profileRepository.usernameExists(
        updates.username,
      );
      if (usernameExists) {
        console.error(
          `SERVICE ERROR: username "${updates.username}" already exists`,
        );
        throw new DomainError(
          ErrorCode.USERNAME_ALREADY_EXISTS,
          "The provided username already exists.",
        );
      }
      updateData.username = updates.username;
    }

    await this.profileRepository.updateProfile(profile.id, updateData);
  }

  async updateProfilePicture(userId: string, key: string) {
    const user = await this.profileRepository.getProfileByUserId(userId);
    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }
    await this.profileRepository.updateProfilePicture(user.profile.id, key);
  }

  async getBasicProfileByUserId(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }

    const profile = await this.profileRepository.getProfileByProfileId(
      user.profileId,
    );
    if (!profile) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    const profilePictureUrl = this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });

    return trpcValidators.output.profile.compactProfile.parse({
      userId: user.id,
      privacy: user.privacySetting,
      username: profile.username,
      name: profile.fullName,
      profilePictureUrl,
    });
  }

  async getBasicProfileByProfileId(profileId: number) {
    const user = await this.userRepository.getUserByProfileId(profileId);
    if (!user) {
      console.error(
        `SERVICE ERROR: User not found for profile ID "${profileId}"`,
      );
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided profile ID.",
      );
    }

    const profile = await this.profileRepository.getProfileByProfileId(
      user.profileId,
    );
    if (!profile) {
      console.error(
        `SERVICE ERROR: Profile not found for profile ID "${profileId}"`,
      );
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided profile ID.",
      );
    }

    const profilePictureUrl = this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });

    return trpcValidators.output.profile.compactProfile.parse({
      userId: user.id,
      privacy: user.privacySetting,
      username: profile.username,
      name: profile.fullName,
      profilePictureUrl,
    });
  }

  async getFullProfileByUserId(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }
    const profile = await this._getUserProfile(userId);

    const followerCount = await this.followRepository.countFollowers(userId);
    if (followerCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count followers for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWERS,
        "Failed to count followers for the user.",
      );
    }

    const followingCount = await this.followRepository.countFollowing(userId);
    if (followingCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count following for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWING,
        "Failed to count following for the user.",
      );
    }

    const friendCount = await this.friendsRepository.countFriends(userId);
    if (friendCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count friends for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FRIENDS,
        "Failed to count friends for the user.",
      );
    }

    const profilePictureUrl = await this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.error(
        `SERVICE ERROR: Failed to get profile picture for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }

    const profileData = {
      userId: user.id,
      privacy: user.privacySetting,
      username: profile.username,
      name: profile.fullName,
      bio: profile.bio,
      followerCount,
      followingCount,
      friendCount,
      profilePictureUrl,
    };

    return trpcValidators.output.profile.fullProfileSelf.parse(profileData);
  }

  async getFullProfileByProfileId(
    currentUserId: string,
    profileId: number,
  ): Promise<z.infer<typeof trpcValidators.output.profile.fullProfileSelf>> {
    const otherUser = await this.userRepository.getUserByProfileId(profileId);
    if (!otherUser) {
      console.error(
        `SERVICE ERROR: User not found for profile ID "${profileId}"`,
      );
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided profile ID.",
      );
    }

    const profile = await this.profileRepository.getProfileByProfileId(
      otherUser.profileId,
    );
    if (!profile) {
      console.error(
        `SERVICE ERROR: Profile not found for profile ID "${profileId}"`,
      );
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided profile ID.",
      );
    }

    const username = profile.username;
    const fullName = profile.fullName;

    if (!username || !fullName) {
      console.error(
        `SERVICE ERROR: Profile username and/or fullname not found for profile ID "${profileId}". Username: ${username}, Fullname: ${fullName}`,
      );
      throw new DomainError(
        ErrorCode.PROFILE_INCOMPLETE,
        "Profile username and/or fullname not found.",
      );
    }

    const followerCount = await this.followRepository.countFollowers(
      otherUser.id,
    );
    if (followerCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count followers for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWERS,
        "Failed to count followers for the user.",
      );
    }

    const followingCount = await this.followRepository.countFollowing(
      otherUser.id,
    );
    if (followingCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count following for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FOLLOWING,
        "Failed to count following for the user.",
      );
    }

    const friendCount = await this.friendsRepository.countFriends(otherUser.id);
    if (friendCount === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count friends for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_COUNT_FRIENDS,
        "Failed to count friends for the user.",
      );
    }

    const profilePictureUrl = await this.s3Repository.getObjectPresignedUrl({
      Bucket: process.env.S3_PROFILE_BUCKET!,
      Key: profile.profilePictureKey,
    });
    if (!profilePictureUrl) {
      console.error(
        `SERVICE ERROR: Failed to get profile picture for user ID "${otherUser.id}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_GET_PROFILE_PICTURE,
        "Failed to get profile picture URL.",
      );
    }
    // Initialize networkStatus with default values
    let networkStatus: z.infer<
      typeof trpcValidators.output.profile.fullProfileOther
    >["networkStatus"] = {
      privacy: otherUser.privacySetting,
      currentUserFollowState: "NotFollowing",
      otherUserFollowState: "NotFollowing",
      currentUserFriendState: "NotFriends",
      otherUserFriendState: "NotFriends",
    };

    const blocked = await this.blockRepository.getBlockedUser(
      otherUser.id,
      currentUserId,
    );

    // Check if the privacy setting is public
    if (otherUser.privacySetting === "public") {
      // Retrieve the current user's follow status towards the other user
      const currentUserFollowState = await this.followRepository.getFollower(
        currentUserId,
        otherUser.id,
      );
      // Retrieve the other user's follow status towards the current user
      const otherUserFollowState = await this.followRepository.getFollower(
        otherUser.id,
        currentUserId,
      );

      // Update networkStatus with the follow states
      networkStatus.currentUserFollowState = currentUserFollowState
        ? "Following"
        : "NotFollowing";
      networkStatus.otherUserFollowState = otherUserFollowState
        ? "Following"
        : "NotFollowing";

      // Retrieve the current user's friend status towards the other user
      const currentUserFriendState = await this.friendsRepository.getFriend(
        currentUserId,
        otherUser.id,
      );
      // Retrieve the other user's friend status towards the current user
      const otherUserFriendState = await this.friendsRepository.getFriend(
        otherUser.id,
        currentUserId,
      );

      // Check if either user is friends with the other (a little redundant, but will help catch logic errors)
      if (currentUserFriendState && otherUserFriendState) {
        networkStatus.currentUserFriendState = "Friends";
        networkStatus.otherUserFriendState = "Friends";
      } else {
        // Retrieve any friend requests made by the current user to the other user
        const currentUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            currentUserId,
            otherUser.id,
          );
        // Retrieve any friend requests made by the other user to the current user
        const otherUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            otherUser.id,
            currentUserId,
          );

        // If current user has sent a friend request to the other user
        if (currentUserFriendRequest) {
          networkStatus.currentUserFriendState = "Requested";
          networkStatus.otherUserFriendState = "IncomingRequest";
        }
        // If other user has sent a friend request to the current user
        else if (otherUserFriendRequest) {
          networkStatus.otherUserFriendState = "Requested";
          networkStatus.currentUserFriendState = "IncomingRequest";
        }
        // If there are no friend requests or friendships, set the states to NotFriends
        else {
          networkStatus.currentUserFriendState = "NotFriends";
          networkStatus.otherUserFriendState = "NotFriends";
        }
      }
    } else if (otherUser.privacySetting === "private") {
      // For private accounts, follow states can be "Requested" or "Following"
      const currentUserFollowState = await this.followRepository.getFollower(
        currentUserId,
        otherUser.id,
      );
      const otherUserFollowState = await this.followRepository.getFollower(
        otherUser.id,
        currentUserId,
      );

      networkStatus.currentUserFollowState = currentUserFollowState
        ? "Following"
        : "NotFollowing";
      networkStatus.otherUserFollowState = otherUserFollowState
        ? "Following"
        : "NotFollowing";

      // Check if there is a follow request from current user to other user
      if (!currentUserFollowState) {
        const currentUserFollowRequest =
          await this.followRepository.getFollowRequest(
            currentUserId,
            otherUser.id,
          );
        networkStatus.currentUserFollowState = currentUserFollowRequest
          ? "Requested"
          : "NotFollowing";
        // If there is a follow requested, the other user's follow state is IncomingRequest
        if (currentUserFollowRequest) {
          networkStatus.otherUserFollowState = "IncomingRequest";
        }
      }

      // Check if there is a follow request from other user to current user
      if (!otherUserFollowState) {
        const otherUserFollowRequest =
          await this.followRepository.getFollowRequest(
            otherUser.id,
            currentUserId,
          );
        networkStatus.otherUserFollowState = otherUserFollowRequest
          ? "Requested"
          : "NotFollowing";
        // If there is a follow requested, the current user's follow state is IncomingRequest
        if (otherUserFollowRequest) {
          networkStatus.currentUserFollowState = "IncomingRequest";
        }
      }

      // Retrieve the current user's friend status towards the other user
      const currentUserFriendState = await this.friendsRepository.getFriend(
        currentUserId,
        otherUser.id,
      );
      // Retrieve the other user's friend status towards the current user
      const otherUserFriendState = await this.friendsRepository.getFriend(
        otherUser.id,
        currentUserId,
      );

      // Check if either user is friends with the other
      if (currentUserFriendState || otherUserFriendState) {
        networkStatus.currentUserFriendState = "Friends";
        networkStatus.otherUserFriendState = "Friends";
      } else {
        // Retrieve any friend requests made by the current user to the other user
        const currentUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            currentUserId,
            otherUser.id,
          );
        // Retrieve any friend requests made by the other user to the current user
        const otherUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            otherUser.id,
            currentUserId,
          );

        // If current user has sent a friend request
        if (currentUserFriendRequest) {
          networkStatus.currentUserFriendState = "Requested";
          networkStatus.otherUserFriendState = "IncomingRequest";
        }
        // If other user has sent a friend request
        else if (otherUserFriendRequest) {
          networkStatus.otherUserFriendState = "Requested";
          networkStatus.currentUserFriendState = "IncomingRequest";
        }
        // If there are no friend requests or friendships, set the states to NotFriends
        else {
          networkStatus.currentUserFriendState = "NotFriends";
          networkStatus.otherUserFriendState = "NotFriends";
        }
      }
    }

    const profileData: z.infer<
      typeof trpcValidators.output.profile.fullProfileOther
    > = {
      userId: otherUser.id,
      username: username,
      name: fullName,
      bio: profile.bio,
      followerCount,
      followingCount,
      friendCount,
      profilePictureUrl,
      blocked: !!blocked,
      networkStatus: networkStatus,
    };

    return trpcValidators.output.profile.fullProfileOther.parse(profileData);
  }

  async removeProfilePicture(userId: string) {
    const user = await this.profileRepository.getProfileByUserId(userId);
    if (!user) {
      console.error(`SERVICE ERROR: User not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }

    const bucket = process.env.S3_POST_BUCKET!;
    const key = `profile-pictures/${userId}.jpg`;
    const deleteObject = await this.s3Repository.deleteObject(bucket, key);

    if (!deleteObject.DeleteMarker) {
      console.error(
        `SERVICE ERROR: Failed to delete profile picture for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_DELETE,
        "Failed to delete the profile picture.",
      );
    }

    await this.profileRepository.removeProfilePicture(user.profile.id);
  }

  async _getNetworkStatus(currentUserId: string, otherUserId: string ) {

    const otherUser = await this.userRepository.getUser(otherUserId);
    if (!otherUser) {
      console.error(`SERVICE ERROR: User not found for user ID "${otherUserId}"`);
      throw new DomainError(
        ErrorCode.USER_NOT_FOUND,
        "User not found for the provided user ID.",
      );
    }

    let networkStatus: z.infer<
      typeof trpcValidators.output.profile.fullProfileOther
    >["networkStatus"] = {
      privacy: otherUser.privacySetting,
      currentUserFollowState: "NotFollowing",
      otherUserFollowState: "NotFollowing",
      currentUserFriendState: "NotFriends",
      otherUserFriendState: "NotFriends",
    };

    const blocked = await this.blockRepository.getBlockedUser(
      otherUser.id,
      currentUserId,
    );

    // Check if the privacy setting is public
    if (otherUser.privacySetting === "public") {
      // Retrieve the current user's follow status towards the other user
      const currentUserFollowState = await this.followRepository.getFollower(
        currentUserId,
        otherUser.id,
      );
      // Retrieve the other user's follow status towards the current user
      const otherUserFollowState = await this.followRepository.getFollower(
        otherUser.id,
        currentUserId,
      );

      // Update networkStatus with the follow states
      networkStatus.currentUserFollowState = currentUserFollowState
        ? "Following"
        : "NotFollowing";
      networkStatus.otherUserFollowState = otherUserFollowState
        ? "Following"
        : "NotFollowing";

      // Retrieve the current user's friend status towards the other user
      const currentUserFriendState = await this.friendsRepository.getFriend(
        currentUserId,
        otherUser.id,
      );
      // Retrieve the other user's friend status towards the current user
      const otherUserFriendState = await this.friendsRepository.getFriend(
        otherUser.id,
        currentUserId,
      );

      // Check if either user is friends with the other (a little redundant, but will help catch logic errors)
      if (currentUserFriendState && otherUserFriendState) {
        networkStatus.currentUserFriendState = "Friends";
        networkStatus.otherUserFriendState = "Friends";
      } else {
        // Retrieve any friend requests made by the current user to the other user
        const currentUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            currentUserId,
            otherUser.id,
          );
        // Retrieve any friend requests made by the other user to the current user
        const otherUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            otherUser.id,
            currentUserId,
          );

        // If current user has sent a friend request to the other user
        if (currentUserFriendRequest) {
          networkStatus.currentUserFriendState = "Requested";
          networkStatus.otherUserFriendState = "IncomingRequest";
        }
        // If other user has sent a friend request to the current user
        else if (otherUserFriendRequest) {
          networkStatus.otherUserFriendState = "Requested";
          networkStatus.currentUserFriendState = "IncomingRequest";
        }
        // If there are no friend requests or friendships, set the states to NotFriends
        else {
          networkStatus.currentUserFriendState = "NotFriends";
          networkStatus.otherUserFriendState = "NotFriends";
        }
      }
    } else if (otherUser.privacySetting === "private") {
      // For private accounts, follow states can be "Requested" or "Following"
      const currentUserFollowState = await this.followRepository.getFollower(
        currentUserId,
        otherUser.id,
      );
      const otherUserFollowState = await this.followRepository.getFollower(
        otherUser.id,
        currentUserId,
      );

      networkStatus.currentUserFollowState = currentUserFollowState
        ? "Following"
        : "NotFollowing";
      networkStatus.otherUserFollowState = otherUserFollowState
        ? "Following"
        : "NotFollowing";

      // Check if there is a follow request from current user to other user
      if (!currentUserFollowState) {
        const currentUserFollowRequest =
          await this.followRepository.getFollowRequest(
            currentUserId,
            otherUser.id,
          );
        networkStatus.currentUserFollowState = currentUserFollowRequest
          ? "Requested"
          : "NotFollowing";
        // If there is a follow requested, the other user's follow state is IncomingRequest
        if (currentUserFollowRequest) {
          networkStatus.otherUserFollowState = "IncomingRequest";
        }
      }

      // Check if there is a follow request from other user to current user
      if (!otherUserFollowState) {
        const otherUserFollowRequest =
          await this.followRepository.getFollowRequest(
            otherUser.id,
            currentUserId,
          );
        networkStatus.otherUserFollowState = otherUserFollowRequest
          ? "Requested"
          : "NotFollowing";
        // If there is a follow requested, the current user's follow state is IncomingRequest
        if (otherUserFollowRequest) {
          networkStatus.currentUserFollowState = "IncomingRequest";
        }
      }

      // Retrieve the current user's friend status towards the other user
      const currentUserFriendState = await this.friendsRepository.getFriend(
        currentUserId,
        otherUser.id,
      );
      // Retrieve the other user's friend status towards the current user
      const otherUserFriendState = await this.friendsRepository.getFriend(
        otherUser.id,
        currentUserId,
      );

      // Check if either user is friends with the other
      if (currentUserFriendState || otherUserFriendState) {
        networkStatus.currentUserFriendState = "Friends";
        networkStatus.otherUserFriendState = "Friends";
      } else {
        // Retrieve any friend requests made by the current user to the other user
        const currentUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            currentUserId,
            otherUser.id,
          );
        // Retrieve any friend requests made by the other user to the current user
        const otherUserFriendRequest =
          await this.friendsRepository.getFriendRequest(
            otherUser.id,
            currentUserId,
          );

        // If current user has sent a friend request
        if (currentUserFriendRequest) {
          networkStatus.currentUserFriendState = "Requested";
          networkStatus.otherUserFriendState = "IncomingRequest";
        }
        // If other user has sent a friend request
        else if (otherUserFriendRequest) {
          networkStatus.otherUserFriendState = "Requested";
          networkStatus.currentUserFriendState = "IncomingRequest";
        }
        // If there are no friend requests or friendships, set the states to NotFriends
        else {
          networkStatus.currentUserFriendState = "NotFriends";
          networkStatus.otherUserFriendState = "NotFriends";
        }
      }
    }

    return networkStatus;
  }

  async _getUserProfile(userId: string) {
    const user = await this.profileRepository.getProfileByUserId(userId);
    if (!user) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    if (!user.profile) {
      console.error(`SERVICE ERROR: Profile not found for user ID "${userId}"`);
      throw new DomainError(
        ErrorCode.PROFILE_NOT_FOUND,
        "Profile not found for the provided user ID.",
      );
    }

    return user.profile;
  }
}
