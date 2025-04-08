import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";

import * as UserErrors from "../../errors/user/user.error";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type { IUserService } from "../../interfaces/services/user/user.service.interface";
import type { UserIdParam } from "../../interfaces/types";
import { UserStatus } from "../../models";
import { TYPES } from "../../types";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.Database)
    private db: Database,
    @inject(TYPES.UserRepository)
    private userRepository: IUserRepository,
  ) {}

  async deleteUser(params: UserIdParam): Promise<Result<void, never>> {
    await this.userRepository.deleteUser(params, this.db);
    return ok();
  }

  async userStatus(
    params: UserIdParam,
  ): Promise<Result<UserStatus, UserErrors.UserNotFound>> {
    const userStatus = await this.userRepository.getUserStatus(params, this.db);

    if (userStatus === undefined)
      return err(new UserErrors.UserNotFound(params.userId));

    return ok(userStatus);
  }

  async markUserAsOnApp(params: UserIdParam): Promise<Result<void, never>> {
    await this.userRepository.markUserAsOnApp(params, this.db);
    return ok();
  }

  async markUserAsTutorialComplete(
    params: UserIdParam,
  ): Promise<Result<void, never>> {
    await this.userRepository.markUserAsTutorialComplete(params, this.db);
    return ok();
  }

  async markUserAsOnboardingComplete(
    params: UserIdParam,
  ): Promise<Result<void, never>> {
    await this.userRepository.markUserAsOnboardingComplete(params, this.db);
    return ok();
  }
}
