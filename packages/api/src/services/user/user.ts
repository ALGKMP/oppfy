import { z } from "zod";

import { auth } from "@oppfy/firebase";

import { accountStatusEnum } from "../../../../db/src/schema";
import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  PostRepository,
  PostStatsRepository,
  ProfileRepository,
  ProfileStatsRepository,
  SearchRepository,
} from "../../repositories";
import { UserRepository } from "../../repositories/user/user";

//TODO: move to validators
export type InferEnum<T extends { enumValues: string[] }> =
  T["enumValues"][number];

export class UserService {
  private searchRepository = new SearchRepository();
  private userRepository = new UserRepository();
  private postRepository = new PostRepository();
  private profileRepository = new ProfileRepository();
  private followRepository = new FollowRepository();
  private blockRepository = new BlockRepository();
  private profileStatsRepository = new ProfileStatsRepository();
  private postStatsRepository = new PostStatsRepository();
  private auth = auth;

  async createUser(
    userId: string,
    phoneNumber: string,
    accountStatus: InferEnum<typeof accountStatusEnum> = "onApp",
  ) {
    let username;
    let usernameExists;
    do {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 17)
        .padEnd(15, "0");
      username = "user" + randomPart;

      usernameExists = await this.profileRepository.usernameExists(username);
    } while (usernameExists);

    await this.userRepository.createUser(
      userId,
      phoneNumber,
      username,
      accountStatus,
    );
  }

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    const user = await this.userRepository.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async getUserByPhoneNumberNoThrow(phoneNumber: string) {
    return await this.userRepository.getUserByPhoneNumber(phoneNumber);
  }

  async getUserByProfileId(profileId: string) {
    const user = await this.userRepository.getUserByProfileId(profileId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.userRepository.updateStatsOnUserDelete(userId);

    await this.profileRepository.deleteProfile(user.profileId);
    await this.searchRepository.deleteProfile(userId);
    await this.auth.deleteUser(userId);
  }

  async checkOnboardingComplete(userId: string | undefined) {
    if (userId === undefined) return false;

    const user = await this.profileRepository.getUserProfile(userId);

    if (user === undefined) return false;

    return [
      user.profile.dateOfBirth,
      user.profile.name,
      user.profile.username,
    ].every((field) => !!field);
  }

  async canAccessUserData({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<boolean> {
    if (currentUserId === targetUserId) return true;

    const targetUser = await this.userRepository.getUser(targetUserId);
    if (!targetUser) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "Target user not found");
    }

    // Check if the current user is blocked by the target user
    const isBlocked = await this.blockRepository.getBlockedUser(
      targetUserId,
      currentUserId,
    );
    const isBlockedByTargetUser = await this.blockRepository.getBlockedUser(
      currentUserId,
      targetUserId,
    );
    if (isBlocked ?? isBlockedByTargetUser) return false;

    if (targetUser.privacySetting === "public") return true;

    const isFollowing = await this.followRepository.getFollower(
      currentUserId,
      targetUserId,
    );
    console.log("isFollowing", isFollowing);
    if (isFollowing) return true;

    return false;
  }

  async updateUserId(oldUserId: string, newUserId: string) {
    const user = await this.userRepository.getUser(oldUserId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.userRepository.updateUserId(oldUserId, newUserId);
  }
}
