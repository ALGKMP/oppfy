import type { Result } from "neverthrow";

import type { UserError } from "../../../errors/user/user.error";
import type { UserStatus } from "../../../models";

interface UserIdParams {
  userId: string;
}

export interface IUserService {
  deleteUser(params: UserIdParams): Promise<Result<void, UserError>>;

  userStatus(params: UserIdParams): Promise<Result<UserStatus, UserError>>;

  markUserAsOnApp(params: UserIdParams): Promise<Result<void, UserError>>;

  markUserAsTutorialComplete(
    params: UserIdParams,
  ): Promise<Result<void, UserError>>;

  markUserAsOnboardingComplete(
    params: UserIdParams,
  ): Promise<Result<void, UserError>>;
}
