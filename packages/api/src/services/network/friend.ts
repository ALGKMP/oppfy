import { DomainError, ErrorCode } from "../../errors";
import { FriendRepository } from "../../repositories/network/friend";

export class FriendService {
  private friendRepository = new FriendRepository();

  async isFriends(userId1: string, userId2: string) {
    return !!(await this.friendRepository.getFriend(userId1, userId2));
  }

  async sendFriendRequest(senderId: string, recipientId: string) {
    const alreadyFriends = await this.isFriends(senderId, recipientId);
    if (alreadyFriends) {
      console.error(`SERVICE ERROR: Users "${senderId}" and "${recipientId}" are already friends`);
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
      console.error(`SERVICE ERROR: Failed to create friend request from "${senderId}" to "${recipientId}"`);
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
      console.error(`SERVICE ERROR: Friend request from "${requesterId}" to "${requestedId}" not found`);
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }
    await this.friendRepository.deleteFriendRequest(requesterId, requestedId);
    const addFriendResult = await this.friendRepository.addFriend(
      requesterId,
      requestedId,
    );
    if (!addFriendResult) {
      console.error(`SERVICE ERROR: Failed to add friend for requester "${requesterId}" and requested "${requestedId}"`);
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
      console.error(`SERVICE ERROR: Friend request from "${requesterId}" to "${requestedId}" not found`);
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }
    await this.friendRepository.deleteFriendRequest(requesterId, requestedId);
  }

  async cancelFriendRequest(requesterId: string, requestedId: string) {
    const friendRequestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!friendRequestExists) {
      console.error(`SERVICE ERROR: Friend request from "${requesterId}" to "${requestedId}" not found`);
      throw new DomainError(
        ErrorCode.FRIEND_REQUEST_NOT_FOUND,
        "Friend request not found",
      );
    }

    const deleteResult = await this.friendRepository.deleteFriendRequest(
      requesterId,
      requestedId,
    );
    if (!deleteResult) {
      console.error(`SERVICE ERROR: Failed to cancel friend request from "${requesterId}" to "${requestedId}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_CANCEL_FRIEND_REQUEST,
        "Failed to cancel friend request",
      );
    }
  }

  async removeFriend(userId1: string, userId2: string) {
    const friendshipExists = await this.friendRepository.getFriend(
      userId1,
      userId2,
    );
    if (!friendshipExists) {
      console.error(`SERVICE ERROR: Friendship between "${userId1}" and "${userId2}" not found`);
      throw new DomainError(
        ErrorCode.FRIENDSHIP_NOT_FOUND,
        "Friendship not found",
      );
    }
    const removeResult = await this.friendRepository.removeFriend(
      userId1,
      userId2,
    );
    if (!removeResult) {
      console.error(`SERVICE ERROR: Failed to remove friendship between "${userId1}" and "${userId2}"`);
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FRIEND,
        "Failed to remove friend",
      );
    }
  }
  
}
