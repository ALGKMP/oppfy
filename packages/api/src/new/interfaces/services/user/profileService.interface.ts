export interface GetUploadProfilePictureUrlParams {
  userId: string;
  contentLength: number;
}

export interface UpdateProfileParams {
  userId: string;
  newData: Partial<{
    name: string;
    username: string;
    bio: string;
    dateOfBirth: Date;
  }>;
}

export interface GetProfileByUsernameParams {
  username: string;
}

export interface GetProfileParams {
  selfUserId: string;
  otherUserId: string;
}

export interface SearchProfilesByUsernameParams {
  username: string;
  selfUserId: string;
}

export interface ProfileStats {
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  postsCount: number;
}

export interface ProfileByUsernameResult {
  userId: string;
  name: string;
  username: string;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileResult {
  userId: string;
  privacy: string;
  username: string;
  name: string;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfileService {
  getUploadProfilePictureUrl(
    params: GetUploadProfilePictureUrlParams,
  ): Promise<string>;

  updateProfile(params: UpdateProfileParams): Promise<void>;

  getProfileByUsername(
    params: GetProfileByUsernameParams,
  ): Promise<ProfileByUsernameResult>;

  getProfile(params: GetProfileParams): Promise<ProfileResult>;

  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<ProfileByUsernameResult[]>;
}
