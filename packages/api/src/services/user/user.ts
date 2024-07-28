import { DomainError, ErrorCode } from "../../errors";
import {
  PostRepository,
  ProfileRepository,
  SearchRepository,
} from "../../repositories";
import { UserRepository } from "../../repositories/user/user";

export class UserService {
  private searchRepository = new SearchRepository();
  private userRepository = new UserRepository();
  private postRepository = new PostRepository();
  private profileRepository = new ProfileRepository();

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

  async getUserByProfileId(profileId: number) {
    const user = await this.userRepository.getUserByProfileId(profileId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND);
    }

    await this.userRepository.deleteUser(userId);
    await this.searchRepository.deleteProfile(user.profileId);
  }

  async checkOnboardingComplete(userId: string) {
    const user = await this.profileRepository.getUserProfile(userId);
    if (!user?.profile) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND, "Profile not found");
    }
    return (
      !!user.profile.dateOfBirth &&
      !!user.profile.fullName &&
      !!user.profile.username
    );
  }

  async isNewUser(uid: string) {
    const counts = await this.postRepository.getCountOfPostsNotOnApp(uid);

    if (counts === undefined) {
      return true;
    }

    return counts[0]?.count === 0;
  }
}
