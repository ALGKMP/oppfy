import type { followStatusEnum } from "@oppfy/db";

export type FollowStatus = (typeof followStatusEnum.enumValues)[number];

export interface IFollowService {
  isFollowing(options: {
    senderId: string;
    recipientId: string;
  }): Promise<boolean>;

  followUser(options: { senderId: string; recipientId: string }): Promise<void>;

  unfollowUser(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void>;

  acceptFollowRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void>;

  declineFollowRequest(options: {
    requestSenderId: string;
    requestRecipientId: string;
  }): Promise<void>;

  cancelFollowRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void>;

  removeFollower(options: {
    userId: string;
    followerToRemove: string;
  }): Promise<void>;

  getFollowStatus(options: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<FollowStatus>;

  getFollowers(options: {
    userId: string;
    cursor?: { createdAt: Date; userId: string } | null;
    pageSize?: number;
  }): Promise<{
    items: {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
    }[];
    nextCursor: { createdAt: Date; userId: string } | null;
  }>;

  getFollowing(options: {
    userId: string;
    cursor?: { createdAt: Date; userId: string } | null;
    pageSize?: number;
  }): Promise<{
    items: {
      userId: string;
      username: string;
      name: string;
      profilePictureUrl: string | null;
      createdAt: Date;
    }[];
    nextCursor: { createdAt: Date; userId: string } | null;
  }>;
}
