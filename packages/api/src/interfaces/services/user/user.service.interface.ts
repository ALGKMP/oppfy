import type { Result } from "neverthrow";

import type * as UserErrors from "../../../errors/user/user.error";
import type { UserStatus } from "../../../models";
import type { UserIdParam } from "../../types";

export interface IUserService {
  deleteUser(params: UserIdParam): Promise<Result<void, never>>;

  userStatus(
    params: UserIdParam,
  ): Promise<Result<UserStatus, UserErrors.UserNotFound>>;

  markUserAsOnApp(params: UserIdParam): Promise<Result<void, never>>;

  markUserAsTutorialComplete(params: UserIdParam): Promise<Result<void, never>>;

  markUserAsOnboardingComplete(
    params: UserIdParam,
  ): Promise<Result<void, never>>;
}
