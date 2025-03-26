import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import { TYPES } from "../../container";
import { UserErrors } from "../../errors/user/user.error";
import type { UserIdParams } from "../../interfaces/repositories/social/follow.repository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type { IUserService } from "../../interfaces/services/user/user.service.interface";
import { UserStatus } from "../../models";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.Database) private db: Database,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
  ) {}

  async deleteUser(params: UserIdParams): Promise<Result<void, never>> {
    await this.userRepository.deleteUser(params, this.db);
    return ok();
  }

  async userStatus(
    params: UserIdParams,
  ): Promise<Result<UserStatus, UserErrors.UserNotFound>> {
    const userStatus = await this.userRepository.getUserStatus(params, this.db);

    if (userStatus === undefined)
      return err(new UserErrors.UserNotFound(params.userId));

    return ok(userStatus);
  }

  async markUserAsOnApp(params: UserIdParams): Promise<Result<void, never>> {
    await this.userRepository.markUserAsOnApp(params, this.db);
    return ok();
  }

  async markUserAsTutorialComplete(
    params: UserIdParams,
  ): Promise<Result<void, never>> {
    await this.userRepository.markUserAsTutorialComplete(params, this.db);
    return ok();
  }

  async markUserAsOnboardingComplete(
    params: UserIdParams,
  ): Promise<Result<void, never>> {
    await this.userRepository.markUserAsOnboardingComplete(params, this.db);
    return ok();
  }
}
