import { z } from "zod";

import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  ContactsRepository,
  FollowRepository,
  PostRepository,
  PostStatsRepository,
  ProfileRepository,
  ProfileStatsRepository,
  SearchRepository,
  UserRepository,
} from "../../repositories";

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
  private contactsRepository = new ContactsRepository();
  private profileStatsRepository = new ProfileStatsRepository();
  private postStatsRepository = new PostStatsRepository();

  async createUserWithUsername(
    userId: string,
    phoneNumber: string,
    name: string,
    isOnApp = true,
  ) {
    let username;
    let usernameExists;

    // make name be just name with no letters or other shit and first name with last night right after
    const goodName = name
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
    do {
      const randomPart = Math.random().toString(10).substring(2, 12);
      username = goodName.substring(0, 15) + `_` + randomPart;

      usernameExists = await this.profileRepository.usernameExists(username);
    } while (usernameExists);

    await this.userRepository.createUser(
      userId,
      phoneNumber,
      username,
      isOnApp,
      name,
    );
  }

  async createUser(userId: string, phoneNumber: string, isOnApp = true) {
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
      isOnApp,
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
    await this.userRepository.deleteUser(userId);
    await this.contactsRepository.deleteContacts(userId);
  }

  // async checkOnboardingComplete(userId: string | undefined) {
  //   if (userId === undefined) return false;

  //   const user = await this.profileRepository.getUserProfile(userId);

  //   if (user === undefined) return false;

  //   return [
  //     user.profile.dateOfBirth,
  //     user.profile.name,
  //     user.profile.username,
  //   ].every((field) => !!field);
  // }

  // async checkTutorialComplete(userId: string) {
  //   const userStatus = await this.userRepository.getUserStatus(userId);

  //   if (userStatus === undefined) return false;

  //   return userStatus.hasCompletedTutorial;
  // }

  async isOnApp(userId: string) {
    const userStatus = await this.userRepository.getUserStatus(userId);
    if (!userStatus) return false;
    return userStatus.isOnApp;
  }

  async completedOnboarding(userId: string) {
    await this.userRepository.updateUserOnboardingComplete(userId, true);
  }

  async completedTutorial(userId: string) {
    await this.userRepository.updateUserTutorialComplete(userId, true);
  }

  async getUserStatus(userId: string) {
    const userStatus = await this.userRepository.getUserStatus(userId);

    if (userStatus === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return userStatus;
  }

  async updateUserOnAppStatus(userId: string, isOnApp: boolean) {
    await this.userRepository.updateUserOnAppStatus(userId, isOnApp);
  }

  async updateUserTutorialComplete(
    userId: string,
    hasCompletedTutorial: boolean,
  ) {
    await this.userRepository.updateUserTutorialComplete(
      userId,
      hasCompletedTutorial,
    );
  }

  async updateUserOnboardingComplete(
    userId: string,
    hasCompletedOnboarding: boolean,
  ) {
    await this.userRepository.updateUserOnboardingComplete(
      userId,
      hasCompletedOnboarding,
    );
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
