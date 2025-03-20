import type { FriendStatus } from "@oppfy/db";

export interface IFriendService {
  isFollowing(options: {
    senderId: string;
    recipientId: string;
  }): Promise<boolean>;

  sendFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void>;

  acceptFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void>;

  declineFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void>;

  cancelFriendRequest(options: {
    senderId: string;
    recipientId: string;
  }): Promise<void>;

  getFriendRequest(options: { senderId: string; recipientId: string }): Promise<
    | {
        senderId: string;
        recipientId: string;
        createdAt: Date;
      }
    | undefined
  >;

  removeFriend(options: {
    targetUserId: string;
    otherUserId: string;
  }): Promise<void>;

  countFriendRequests(options: { userId: string }): Promise<number>;

  determineFriendState(options: {
    userId: string;
    targetUserId: string;
  }): Promise<FriendStatus>;

  friendshipExists(options: {
    userIdA: string;
    userIdB: string;
  }): Promise<boolean>;
}
