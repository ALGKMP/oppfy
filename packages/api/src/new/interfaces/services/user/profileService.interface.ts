import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

export interface GetUploadProfilePictureUrlParams {
  userId: string;
  contentLength: number;
}

export interface UpdateProfileParams {
  userId: string;
  newData: {
    name?: string;
    username?: string;
    bio?: string;
    dateOfBirth?: Date;
  }
}

export interface GetProfileByUsernameParams {
  username: string;
}

export interface GetProfileSelfParams {
  userId: string;
}

export interface GetProfileOtherParams {
  currentUserId: string;
  otherUserId: string;
}

export interface SearchProfilesByUsernameParams {
  username: string;
  currentUserId: string;
}

export interface ProfileStats {
  followers: number;
  following: number;
  friends: number;
  posts: number;
}

export interface NetworkStatus {
  privacy: string;
  blocked: boolean;
  targetUserFollowState: string;
  otherUserFollowState: string;
  targetUserFriendState: string;
  otherUserFriendState: string;
  isTargetUserBlocked: boolean;
  isOtherUserBlocked: boolean;
}

export interface ProfileByUsernameResult {
  id: string;
  name: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: Date;
}

export interface ProfileSelfResult {
  userId: string;
  profileId: string;
  privacy: string;
  username: string;
  name: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  postCount: number;
  profilePictureUrl: string | null;
  profileStats: ProfileStats;
  createdAt: Date;
}

export interface ProfileOtherResult {
  userId: string;
  profileId: string;
  privacy: string;
  username: string;
  name: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  postCount: number;
  profilePictureUrl: string | null;
  networkStatus: NetworkStatus;
  createdAt: Date;
}

export interface IProfileService {
  getUploadProfilePictureUrl(
    params: GetUploadProfilePictureUrlParams,
  ): Promise<string>;

  updateProfile(params: UpdateProfileParams): Promise<void>;

  getProfileByUsername(
    params: GetProfileByUsernameParams,
  ): Promise<ProfileByUsernameResult>;

  getProfileSelf(params: GetProfileSelfParams): Promise<ProfileSelfResult>;

  getProfileOther(params: GetProfileOtherParams): Promise<ProfileOtherResult>;

  searchProfilesByUsername(
    params: SearchProfilesByUsernameParams,
  ): Promise<ProfileByUsernameResult[]>;
}
