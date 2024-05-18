import { DomainError, ErrorCode } from "../../errors";
import { UserRepository } from "../../repositories/user";

export class UserService {
  private userRepository = new UserRepository();

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, 'User not found');
    }
    return user;
  }

  async createUser(userId: string) {
    const userExists = await this._userExists(userId);
    if (userExists) {
      throw new DomainError(ErrorCode.USER_ALREADY_EXISTS, 'User already exists');
    }
    return await this.userRepository.createUser(userId);
  }

  async deleteUser(userId: string) {
    const userExists = await this._userExists(userId);
    if (!userExists) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, 'User not found');
    }
    await this.userRepository.deleteUser(userId);
  }

  async checkOnboardingComplete(userId: string) {
    const user = await this.userRepository.getUserProfile(userId);
    if (user?.profile === undefined) {
      throw new DomainError(ErrorCode.PROFILE_NOT_FOUND, 'Profile not found');
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
