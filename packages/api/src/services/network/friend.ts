import { FriendState } from "@oppfy/validators";

import { DomainError, ErrorCode } from "../../errors";
import { FriendRepository } from "../../repositories/network/friend";
import { FollowRepository } from "../../repositories";

export class FriendService {
  private friendRepository = new FriendRepository();
  private followRepository = new FollowRepository();

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
    const result = await this.friendRepository.createFriendRequest(
      senderId,
      recipientId,
    );
    if (!result) {
      console.error(
        `SERVICE ERROR: Failed to create friend request from "${senderId}" to "${recipientId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_REQUEST_FRIEND,
        "Failed to create friend request",
      );
    }
  }

  async acceptFriendRequest(requesterId: string, requestedId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!requestExists) {
      console.error(
        `SERVICE ERROR: Friend request from "${requesterId}" to "${requestedId}" not found`,
      );
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }
    const addFriendResult = await this.friendRepository.addFriend(
      requesterId,
      requestedId,
    );

    if (!addFriendResult) {
      console.error(
        `SERVICE ERROR: Failed to add friend for requester "${requesterId}" and requested "${requestedId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_ADD_FRIEND,
        "Failed to add friend",
      );
    }
  }

  async rejectFriendRequest(requesterId: string, requestedId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!requestExists) {
      console.error(
        `SERVICE ERROR: Friend request from "${requesterId}" to "${requestedId}" not found`,
      );
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }
    await this.friendRepository.cancelFriendRequest(requesterId, requestedId);
  }

  async cancelFriendRequest(requesterId: string, requestedId: string) {
    const friendRequestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!friendRequestExists) {
      console.error(
        `SERVICE ERROR: Friend request from "${requesterId}" to "${requestedId}" not found`,
      );
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    const deleteResult = await this.friendRepository.cancelFriendRequest(
      requesterId,
      requestedId,
    );
    if (!deleteResult) {
      console.error(
        `SERVICE ERROR: Failed to cancel friend request from "${requesterId}" to "${requestedId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_CANCEL_FRIEND_REQUEST,
        "Failed to cancel friend request",
      );
    }
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
    const removeResult = await this.friendRepository.removeFriend(
      targetUserId,
      otherUserId,
    );
    if (!removeResult) {
      console.error(
        `SERVICE ERROR: Failed to remove friendship between "${targetUserId}" and "${otherUserId}"`,
      );
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FRIEND,
        "Failed to remove friend",
      );
    }
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
