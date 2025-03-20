import type { Result } from "neverthrow";
import type { User } from "../../../models";

import type { UserErrors } from "../../../errors/user/user.error";

export interface CreateUserWithUsernameParams {
  userId: string;
  phoneNumber: string;
  name: string;
  isOnApp?: boolean;
}

export interface CreateUserParams {
  userId: string;
  phoneNumber: string;
  isOnApp?: boolean;
}

export interface GetUserParams {
  userId: string;
}

export interface GetUserByPhoneNumberParams {
  phoneNumber: string;
}

export interface DeleteUserParams {
  userId: string;
}

export interface IsUserOnAppParams {
  userId: string;
}

export interface CompletedOnboardingParams {
  userId: string;
}

export interface GetUserStatusParams {
  userId: string;
}

export interface SetTutorialCompleteParams {
  userId: string;
}

export interface IsUserOnboardedParams {
  userId: string;
}

export interface HasTutorialBeenCompletedParams {
  userId: string;
}

export interface UpdateUserOnAppStatusParams {
  userId: string;
  isOnApp: boolean;
}

export interface UpdateUserTutorialCompleteParams {
  userId: string;
  hasCompletedTutorial: boolean;
}

export interface IUserService {
  createUserWithUsername(
    params: CreateUserWithUsernameParams,
  ): Promise<Result<void, UserErrors.UserNotFound>>;

  createUser(
    params: CreateUserParams,
  ): Promise<Result<void, UserErrors.UserNotFound>>;

  getUser(params: GetUserParams): Promise<Result<User, UserErrors.UserNotFound>>;

  getUserByPhoneNumber(
    params: GetUserByPhoneNumberParams,
  ): Promise<Result<User, UserErrors.UserNotFound>>;

  getUserByPhoneNumberNoThrow(
    params: GetUserByPhoneNumberParams,
  ): Promise<Result<User | undefined, never>>;

  deleteUser(
    params: DeleteUserParams,
  ): Promise<Result<void, UserErrors.UserNotFound>>;

  isUserOnApp(params: IsUserOnAppParams): Promise<Result<boolean, never>>;

  completedOnboarding(
    params: CompletedOnboardingParams,
  ): Promise<Result<void, UserErrors.UserNotFound>>;

  getUserStatus(params: GetUserStatusParams): Promise<
    Result<
      {
        userId: string;
        isOnApp: boolean;
        hasCompletedOnboarding: boolean;
        hasCompletedTutorial: boolean;
      },
      UserErrors.UserNotFound
    >
  >;

  setTutorialComplete(
    params: SetTutorialCompleteParams,
  ): Promise<Result<void, UserErrors.UserNotFound>>;

  isUserOnboarded(
    params: IsUserOnboardedParams,
  ): Promise<Result<boolean, never>>;

  hasTutorialBeenCompleted(
    params: HasTutorialBeenCompletedParams,
  ): Promise<Result<boolean, never>>;

  updateUserOnAppStatus(
    params: UpdateUserOnAppStatusParams,
  ): Promise<Result<void, UserErrors.UserNotFound>>;

  updateUserTutorialComplete(
    params: UpdateUserTutorialCompleteParams,
  ): Promise<Result<void, UserErrors.UserNotFound>>;

  updateUserOnboardingComplete(options: {
    userId: string;
    hasCompletedOnboarding: boolean;
  }): Promise<Result<void, UserErrors.UserNotFound>>;

  canAccessUserData(options: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<Result<boolean, UserErrors.UserNotFound>>;

  deleteProfileFromOpenSearch(options: {
    userId: string;
  }): Promise<Result<void, UserErrors.UserNotFound>>;
}
