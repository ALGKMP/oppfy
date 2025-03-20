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
  createUserWithUsername(params: CreateUserWithUsernameParams): Promise<void>;

  createUser(params: CreateUserParams): Promise<void>;

  getUser(params: GetUserParams): Promise<{
    id: string;
    phoneNumber: string;
    username: string;
    isOnApp: boolean;
    privacySetting: "public" | "private";
    notificationSettingsId: string;
  }>;

  getUserByPhoneNumber(params: GetUserByPhoneNumberParams): Promise<{
    id: string;
    phoneNumber: string;
    username: string;
    isOnApp: boolean;
    privacySetting: "public" | "private";
    notificationSettingsId: string;
  }>;

  getUserByPhoneNumberNoThrow(params: GetUserByPhoneNumberParams): Promise<
    | {
        id: string;
        phoneNumber: string;
        username: string;
        isOnApp: boolean;
        privacySetting: "public" | "private";
        notificationSettingsId: string;
      }
    | undefined
  >;

  deleteUser(params: DeleteUserParams): Promise<void>;

  isUserOnApp(params: IsUserOnAppParams): Promise<boolean>;

  completedOnboarding(params: CompletedOnboardingParams): Promise<void>;

  getUserStatus(params: GetUserStatusParams): Promise<{
    userId: string;
    isOnApp: boolean;
    hasCompletedOnboarding: boolean;
    hasCompletedTutorial: boolean;
  }>;

  setTutorialComplete(params: SetTutorialCompleteParams): Promise<void>;

  isUserOnboarded(params: IsUserOnboardedParams): Promise<boolean>;

  hasTutorialBeenCompleted(
    params: HasTutorialBeenCompletedParams,
  ): Promise<boolean>;

  updateUserOnAppStatus(params: UpdateUserOnAppStatusParams): Promise<void>;

  updateUserTutorialComplete(
    params: UpdateUserTutorialCompleteParams,
  ): Promise<void>;

  updateUserOnboardingComplete(options: {
    userId: string;
    hasCompletedOnboarding: boolean;
  }): Promise<void>;

  canAccessUserData(options: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<boolean>;

  deleteProfileFromOpenSearch(options: { userId: string }): Promise<void>;
}
