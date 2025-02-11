import { createHash } from "crypto";

import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  ContactsRepository,
  FollowRepository,
  NotificationsRepository,
  PostRepository,
  PostStatsRepository,
  ProfileRepository,
  ProfileStatsRepository,
  UserRepository,
} from "../../repositories";
import { SQSService } from "../aws/sqs";

import { openSearch, OpenSearchIndex } from "@oppfy/opensearch";

export type InferEnum<T extends { enumValues: string[] }> =
  T["enumValues"][number];

export class UserService {
  private userRepository = new UserRepository();
  private postRepository = new PostRepository();
  private profileRepository = new ProfileRepository();
  private followRepository = new FollowRepository();
  private blockRepository = new BlockRepository();
  private contactsRepository = new ContactsRepository();
  private profileStatsRepository = new ProfileStatsRepository();
  private postStatsRepository = new PostStatsRepository();
  private notificationsRepository = new NotificationsRepository();

  private sqsService = new SQSService();

  async createUserWithUsername(
    userId: string,
    phoneNumber: string,
    name: string,
    isOnApp = true,
  ) {
    let username;
    let usernameExists;

    // make name be just name with no letters or other shit and first name with last night right after
    const goodName = name
      .replace(/[^a-zA-Z0-9]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
    do {
      const randomPart = Math.random().toString(10).substring(2, 12);
      username = goodName.substring(0, 15) + `_` + randomPart;

      usernameExists = await this.profileRepository.usernameExists(username);
    } while (usernameExists);

    await this.userRepository.createUser(
      userId,
      phoneNumber,
      username,
      isOnApp,
      name,
    );

    const fetchAndSendNotifications = async (userId: string) => {
      const pageSize = 10;
      let cursor: { createdAt: Date; postId: string } | null = null;

      do {
        try {
          const rawPosts = await this.postRepository.paginatePostsOfUser(
            userId,
            cursor,
            pageSize + 1, // Fetch an extra item to check for more pages
          );

          if (rawPosts.length === 0) break;

          // Split into current page and check if there's more data
          const hasMore = rawPosts.length > pageSize;
          const currentPosts = hasMore ? rawPosts.slice(0, -1) : rawPosts;

          const notis = currentPosts.map(
            ({ postId, authorId, recipientName }) => ({
              senderId: userId,
              recipientId: authorId,
              notificationData: {
                title: "OPP ALERT",
                body: `${recipientName} made their account!`,
                entityId: postId,
                entityType: "post",
              },
            }),
          );

          const mappedNotis = await Promise.all(
            notis.map(async (noti) => {
              return {
                pushTokens: await this.notificationsRepository.getPushTokens(
                  noti.recipientId,
                ),
                senderId: noti.senderId,
                recipientId: noti.recipientId,
                notificationData: noti.notificationData,
              };
            }),
          );

          await this.notificationsRepository.sendNotifications(mappedNotis);

          cursor = hasMore
            ? {
                createdAt: currentPosts[currentPosts.length - 1]!.createdAt,
                postId: currentPosts[currentPosts.length - 1]!.postId,
              }
            : null;
        } catch (error) {
          console.error("Error in notification pipeline:", error);
          break;
        }
      } while (cursor !== null);
    };

    await fetchAndSendNotifications(userId);
  }

  async createUser(userId: string, phoneNumber: string, isOnApp = true) {
    let username;
    let usernameExists;
    do {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 17)
        .padEnd(15, "0");
      username = "user" + randomPart;

      usernameExists = await this.profileRepository.usernameExists(username);
    } while (usernameExists);

    await this.userRepository.createUser(
      userId,
      phoneNumber,
      username,
      isOnApp,
    );
  }

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    const user = await this.userRepository.getUserByPhoneNumber(phoneNumber);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async getUserByPhoneNumberNoThrow(phoneNumber: string) {
    return await this.userRepository.getUserByPhoneNumber(phoneNumber);
  }

  async getUserByProfileId(profileId: string) {
    const user = await this.userRepository.getUserByProfileId(profileId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.userRepository.updateStatsOnUserDelete(userId);

    await this.profileRepository.deleteProfile(user.profileId);
    await this.deleteProfileFromOpenSearch(userId);

    await this.userRepository.deleteUser(userId);
    await this.contactsRepository.deleteContacts(userId);

    const userPhoneNumberHash = createHash("sha512")
      .update(user.phoneNumber)
      .digest("hex");

    await this.sqsService.sendContactSyncMessage({
      userId,
      userPhoneNumberHash,
      contacts: [],
    });
  }

  // async checkOnboardingComplete(userId: string | undefined) {
  //   if (userId === undefined) return false;

  //   const user = await this.profileRepository.getUserProfile(userId);

  //   if (user === undefined) return false;

  //   return [
  //     user.profile.dateOfBirth,
  //     user.profile.name,
  //     user.profile.username,
  //   ].every((field) => !!field);
  // }

  // async checkTutorialComplete(userId: string) {
  //   const userStatus = await this.userRepository.getUserStatus(userId);

  //   if (userStatus === undefined) return false;

  //   return userStatus.hasCompletedTutorial;
  // }

  async isOnApp(userId: string) {
    const userStatus = await this.userRepository.getUserStatus(userId);
    if (!userStatus) return false;
    return userStatus.isOnApp;
  }

  async completedOnboarding(userId: string) {
    await this.userRepository.updateUserOnboardingComplete(userId, true);
  }

  async completedTutorial(userId: string) {
    await this.userRepository.updateUserTutorialComplete(userId, true);
  }

  async getUserStatus(userId: string) {
    const userStatus = await this.userRepository.getUserStatus(userId);

    if (userStatus === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return userStatus;
  }

  async updateUserOnAppStatus(userId: string, isOnApp: boolean) {
    await this.userRepository.updateUserOnAppStatus(userId, isOnApp);
  }

  async updateUserTutorialComplete(
    userId: string,
    hasCompletedTutorial: boolean,
  ) {
    await this.userRepository.updateUserTutorialComplete(
      userId,
      hasCompletedTutorial,
    );
  }

  async updateUserOnboardingComplete(
    userId: string,
    hasCompletedOnboarding: boolean,
  ) {
    await this.userRepository.updateUserOnboardingComplete(
      userId,
      hasCompletedOnboarding,
    );
  }

  async canAccessUserData({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<boolean> {
    if (currentUserId === targetUserId) return true;

    const targetUser = await this.userRepository.getUser(targetUserId);
    if (!targetUser) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "Target user not found");
    }

    // Check if the current user is blocked by the target user
    const isBlocked = await this.blockRepository.getBlockedUser(
      targetUserId,
      currentUserId,
    );
    const isBlockedByTargetUser = await this.blockRepository.getBlockedUser(
      currentUserId,
      targetUserId,
    );
    if (isBlocked ?? isBlockedByTargetUser) return false;

    if (targetUser.privacySetting === "public") return true;

    const isFollowing = await this.followRepository.getFollower(
      currentUserId,
      targetUserId,
    );
    console.log("isFollowing", isFollowing);
    if (isFollowing) return true;

    return false;
  }

  async updateUserId(oldUserId: string, newUserId: string) {
    const user = await this.userRepository.getUser(oldUserId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.userRepository.updateUserId(oldUserId, newUserId);
  }

  async deleteProfileFromOpenSearch(userId: string) {
    await openSearch.delete({
      index: OpenSearchIndex.PROFILE,
      id: userId,
    });
  }
}
