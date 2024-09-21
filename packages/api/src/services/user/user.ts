import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  FollowRepository,
  PostRepository,
  ProfileRepository,
  ProfileStatsRepository,
  SearchRepository,
  PostStatsRepository,
} from "../../repositories";
import { UserRepository } from "../../repositories/user/user";
import { auth } from "@oppfy/firebase";

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

  async createUser(userId: string, phoneNumber: string) {
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

    await this.userRepository.createUser(userId, phoneNumber, username);
  }

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
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
      user.profile.fullName,
      user.profile.username,
    ].every((field) => !!field);
  }

  async isNewUser(uid: string) {
    const counts = await this.postRepository.getCountOfPostsNotOnApp(uid);

    return counts[0]?.count === 0;
  }

  async canAccessUserData({currentUserId, targetUserId}: {currentUserId: string, targetUserId: string}): Promise<boolean> {
    if (currentUserId === targetUserId) return true;

    const targetUser = await this.userRepository.getUser(targetUserId);
    if (!targetUser) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "Target user not found");
    }

    // Check if the current user is blocked by the target user
    const isBlocked = await this.blockRepository.getBlockedUser(targetUserId, currentUserId);
    if (isBlocked) return false;

    if (targetUser.privacySetting === "public") return true;

    const isFollowing = await this.followRepository.getFollower(currentUserId, targetUserId);
    console.log("isFollowing", isFollowing);
    if (isFollowing) return true;

    return false;
  }

}
