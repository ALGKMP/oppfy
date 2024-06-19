import { DomainError, ErrorCode } from "../../errors";
import { ProfileRepository } from "../../repositories";
import { UserRepository } from "../../repositories/user/user";

export class UserService {
  private userRepository = new UserRepository();
  private profileRepository = new ProfileRepository();

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

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

    return await this.userRepository.createUser(userId, phoneNumber, username);
  }

  async deleteUser(userId: string) {
    const userExists = await this._userExists(userId);
    if (!userExists) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    await this.userRepository.deleteUser(userId);
  }

  async checkOnboardingComplete(userId: string) {
    const user = await this.profileRepository.getProfileByUserId(userId);
    if (user?.profile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND, "Profile not found");
    }
    return (
      !!user.profile.dateOfBirth &&
      !!user.profile.fullName &&
      !!user.profile.username
    );
  }

  private async _userExists(userId: string) {
    const user = await this.userRepository.getUser(userId);
    return user !== undefined;
  }
}
