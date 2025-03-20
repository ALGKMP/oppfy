export interface IUserService {
  createUserWithUsername(options: {
    userId: string;
    phoneNumber: string;
    name: string;
    isOnApp?: boolean;
  }): Promise<void>;

  createUser(options: {
    userId: string;
    phoneNumber: string;
    isOnApp?: boolean;
  }): Promise<void>;

  getUser(options: { userId: string }): Promise<{
    id: string;
    phoneNumber: string;
    username: string;
    isOnApp: boolean;
    privacySetting: "public" | "private";
    notificationSettingsId: string;
  }>;

  getUserByPhoneNumber(options: { phoneNumber: string }): Promise<{
    id: string;
    phoneNumber: string;
    username: string;
    isOnApp: boolean;
    privacySetting: "public" | "private";
    notificationSettingsId: string;
  }>;

  getUserByPhoneNumberNoThrow(options: { phoneNumber: string }): Promise<
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

  deleteUser(options: { userId: string }): Promise<void>;

  isUserOnApp(options: { userId: string }): Promise<boolean>;

  completedOnboarding(options: { userId: string }): Promise<void>;

  getUserStatus(options: { userId: string }): Promise<{
    userId: string;
    isOnApp: boolean;
    hasCompletedOnboarding: boolean;
    hasCompletedTutorial: boolean;
  }>;

  setTutorialComplete(options: { userId: string }): Promise<void>;

  isUserOnboarded(options: { userId: string }): Promise<boolean>;

  hasTutorialBeenCompleted(options: { userId: string }): Promise<boolean>;

  updateUserOnAppStatus(options: {
    userId: string;
    isOnApp: boolean;
  }): Promise<void>;

  updateUserTutorialComplete(options: {
    userId: string;
    hasCompletedTutorial: boolean;
  }): Promise<void>;

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
