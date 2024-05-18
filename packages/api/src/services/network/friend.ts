import { DomainError, ErrorCode } from "../../errors";
import { FriendRepository } from "../../repositories/friend";

export class FriendService {
  private friendRepository = new FriendRepository();

  async isFriends(userId1: string, userId2: string) {
    return !!(await this.friendRepository.getFriend(userId1, userId2));
  }

  async sendFriendRequest(senderId: string, recipientId: string) {
    const alreadyFriends = await this.isFriends(senderId, recipientId);
    if (alreadyFriends) {
      throw new DomainError(
        ErrorCode.USER_ALREADY_FRIENDS,
        "User already friends",
      );
    }
    const result = await this.friendRepository.createFriendRequest(
      senderId,
      recipientId,
    );
    if (!result) {
      throw new DomainError(
        ErrorCode.FAILED_TO_REQUEST_FRIEND,
        "Failed to request friend",
      );
    }
  }

  async acceptFriendRequest(requesterId: string, requestedId: string) {
    const requestExists = await this.friendRepository.getFriendRequest(
      requesterId,
      requestedId,
    );
    if (!requestExists) {
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
      throw new DomainError(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
    }

    const deleteResult = await this.friendRepository.deleteFriendRequest(
      requesterId,
      requestedId,
    );
    if (!deleteResult) {
      throw new DomainError(ErrorCode.FAILED_TO_CANCEL_FRIEND_REQUEST);
    }
  }

  async removeFriend(userId1: string, userId2: string) {
    const friendshipExists = await this.friendRepository.getFriend(
      userId1,
      userId2,
    );
    if (!friendshipExists) {
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
      throw new DomainError(
        ErrorCode.FAILED_TO_REMOVE_FRIEND,
        "Failed to remove friend",
      );
    }
  }
}
