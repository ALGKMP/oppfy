import { FriendState } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FriendRepository } from "../../repositories/network/friend";

export class FriendService {
  private friendRepository = new FriendRepository();

  async areFriends(userId1: string, userId2: string) {
    const friendshipExists = await this.friendRepository.getFriend(
      userId1,
      userId2,
    );
    const reverseFriendshipExists = await this.friendRepository.getFriend(
      userId2,
      userId1,
    );
    return !!friendshipExists || !!reverseFriendshipExists;
  }

  async sendFriendRequest(senderId: string, recipientId: string) {
    const alreadyFriends = await this.areFriends(senderId, recipientId);
    if (alreadyFriends) {
      console.error(
        `SERVICE ERROR: Users "${senderId}" and "${recipientId}" are already friends`,
      );
      throw new DomainError(
        ErrorCode.USER_ALREADY_FRIENDS,
        "Users are already friends",
      );
    }
    return await this.friendRepository.createFriendRequest(
      senderId,
      recipientId,
    );
  }

  async acceptFriendRequest(senderId: string, recipientId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      senderId,
      recipientId,
    );
    if (!requestExists) {
      console.error(
        `SERVICE ERROR: Friend request from "${senderId}" to "${recipientId}" not found`,
      );
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }
    const addFriendResult = await this.friendRepository.addFriend(
      senderId,
      recipientId,
    );

    if (!addFriendResult) {
      console.error(
        `SERVICE ERROR: Failed to add friend for requester "${senderId}" and requested "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_ADD_FRIEND,
        "Failed to add friend",
      );
    }
  }

  async rejectFriendRequest(senderId: string, recipientId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      senderId,
      recipientId,
    );
    if (!requestExists) {
      console.error(
        `SERVICE ERROR: Friend request from "${senderId}" to "${recipientId}" not found`,
      );
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }
    await this.friendRepository.cancelFriendRequest(senderId, recipientId);
  }

  async cancelFriendRequest(senderId: string, recipientId: string) {
    const friendRequestExists = await this.friendRepository.getFriendRequest(
      senderId,
      recipientId,
    );
    if (!friendRequestExists) {
      console.error(
        `SERVICE ERROR: Friend request from "${senderId}" to "${recipientId}" not found`,
      );
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    return await this.friendRepository.cancelFriendRequest(
      senderId,
      recipientId,
    );
  }

  async getFriendRequest(userId: string, targetUserId: string) {
    const friendRequests = await this.friendRepository.getFriendRequest(
      userId,
      targetUserId,
    );
    if (!friendRequests) {
      console.log(
        `No friend request found between ${userId} and ${targetUserId}`,
      );
    }
    return friendRequests;
  }

  async removeFriend(targetUserId: string, otherUserId: string) {
    const friendshipExists = await this.friendRepository.getFriend(
      targetUserId,
      otherUserId,
    );
    if (!friendshipExists) {
      console.error(
        `SERVICE ERROR: Friendship between "${targetUserId}" and "${otherUserId}" not found`,
      );
      throw new DomainError(
        ErrorCode.FRIENDSHIP_NOT_FOUND,
        "Friendship not found",
      );
    }
    return await this.friendRepository.removeFriend(targetUserId, otherUserId);
  }

  public async countFriendRequests(userId: string) {
    const result = await this.friendRepository.countFriendRequests(userId);
    if (result === undefined) {
      console.error(
        `SERVICE ERROR: Failed to count friend requests for user ID "${userId}"`,
      );
      throw new DomainError(
        ErrorCode.DATABASE_ERROR,
        "Failed to count friend requests",
      );
    }
    return result;
  }

  public async determineFriendState(userId: string, targetUserId: string) {
    const areFriends = await this.areFriends(userId, targetUserId);
    const friendRequest = await this.getFriendRequest(userId, targetUserId);
    const incomingRequest = await this.getFriendRequest(targetUserId, userId);

    if (areFriends) {
      return FriendState.Enum.Friends;
    } else if (friendRequest) {
      return FriendState.Enum.OutboundRequest;
    } else if (incomingRequest) {
      return FriendState.Enum.IncomingRequest;
    } else {
      return FriendState.Enum.NotFriends;
    }
  }
}
