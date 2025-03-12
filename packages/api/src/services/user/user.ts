import { createHash } from "crypto";

import { env } from "@oppfy/env";
import type { NotificationMessage } from "@oppfy/sns";
import { sns } from "@oppfy/sns";
import { sqs } from "@oppfy/sqs";

import { DomainError, ErrorCode } from "../../errors";
import {
  BlockRepository,
  ContactsRepository,
  FollowRepository,
  NotificationsRepository,
  PostRepository,
  ProfileRepository,
  UserRepository,
} from "../../repositories";

export type InferEnum<T extends { enumValues: string[] }> =
  T["enumValues"][number];

export class UserService {
  private userRepository = new UserRepository();
  private postRepository = new PostRepository();
  private profileRepository = new ProfileRepository();
  private followRepository = new FollowRepository();
  private blockRepository = new BlockRepository();
  private contactsRepository = new ContactsRepository();
  private notificationsRepository = new NotificationsRepository();

  async createUserWithUsername({
    userId,
    phoneNumber,
    name,
    isOnApp = true,
  }: {
    userId: string;
    phoneNumber: string;
    name: string;
    isOnApp?: boolean;
  }) {
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

      usernameExists = await this.profileRepository.usernameExists({
        username,
      });
    } while (usernameExists);

    await this.userRepository.createUser({
      userId,
      phoneNumber,
      username,
      isOnApp,
      name,
    });

    const fetchAndSendNotifications = async (userId: string) => {
      const pageSize = 10;
      let cursor: { createdAt: Date; postId: string } | null = null;

      do {
        try {
          const rawPosts = await this.postRepository.paginatePostsOfUser({
            userId,
            cursor,
            pageSize: pageSize + 1,
          });

          if (rawPosts.length === 0) break;

          const hasMore = rawPosts.length > pageSize;
          const currentPosts = hasMore ? rawPosts.slice(0, -1) : rawPosts;

          const notis = await Promise.all(
            currentPosts.map(async ({ postId, authorId, recipientName }) => {
              const pushTokens =
                await this.notificationsRepository.getPushTokens({
                  userId: authorId,
                });

              return {
                pushTokens,
                senderId: userId,
                recipientId: authorId,
                title: "OPP ALERT",
                body: `${recipientName} made their account!`,
                entityId: postId,
                entityType: "post",
              };
            }),
          );

          await sns.sendBatchNotifications(
            env.SNS_PUSH_NOTIFICATION_TOPIC_ARN,
            notis as NotificationMessage[],
            "New notification",
          );

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

  async createUser({
    userId,
    phoneNumber,
    isOnApp = true,
  }: {
    userId: string;
    phoneNumber: string;
    isOnApp?: boolean;
  }) {
    let username;
    let usernameExists;
    do {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 17)
        .padEnd(15, "0");
      username = "user" + randomPart;

      usernameExists = await this.profileRepository.usernameExists({
        username,
      });
    } while (usernameExists);

    await this.userRepository.createUser({
      userId,
      phoneNumber,
      username,
      isOnApp,
    });
  }

  async getUser({ userId }: { userId: string }) {
    const user = await this.userRepository.getUser({ userId });
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async getUserByPhoneNumber({ phoneNumber }: { phoneNumber: string }) {
    const user = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }
    return user;
  }

  async getUserByPhoneNumberNoThrow({ phoneNumber }: { phoneNumber: string }) {
    return await this.userRepository.getUserByPhoneNumber({ phoneNumber });
  }

  async deleteUser({ userId }: { userId: string }) {
    const user = await this.userRepository.getUser({ userId });
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.userRepository.updateStatsOnUserDelete({ userId });

    await this.deleteProfileFromOpenSearch({ userId });

    await this.userRepository.deleteUser({ userId });
    await this.contactsRepository.deleteContacts({ userId });

    const userPhoneNumberHash = createHash("sha512")
      .update(user.phoneNumber)
      .digest("hex");

    try {
      await sqs.sendContactSyncMessage({
        userId,
        userPhoneNumberHash,
        contacts: [],
      });
    } catch (err) {
      throw new DomainError(
        ErrorCode.SQS_FAILED_TO_SEND_MESSAGE,
        "SQS failed while trying to send contact sync message",
      );
    }
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

  async isUserOnApp({ userId }: { userId: string }) {
    const userStatus = await this.userRepository.getUserStatus({ userId });
    return userStatus?.isOnApp ?? false;
  }

  async completedOnboarding({ userId }: { userId: string }) {
    await this.userRepository.updateUserOnboardingComplete({
      userId,
      hasCompletedOnboarding: true,
    });
  }

  async getUserStatus({ userId }: { userId: string }) {
    const userStatus = await this.userRepository.getUserStatus({ userId });

    if (userStatus === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    return userStatus;
  }

  async setTutorialComplete({ userId }: { userId: string }) {
    await this.userRepository.updateUserTutorialComplete({
      userId,
      hasCompletedTutorial: true,
    });
  }

  async isUserOnboarded({ userId }: { userId: string }) {
    const userStatus = await this.userRepository.getUserStatus({ userId });
    return userStatus?.hasCompletedOnboarding ?? false;
  }

  async hasTutorialBeenCompleted({ userId }: { userId: string }) {
    const userStatus = await this.userRepository.getUserStatus({ userId });
    return userStatus?.hasCompletedTutorial ?? false;
  }

  async updateUserOnAppStatus({
    userId,
    isOnApp,
  }: {
    userId: string;
    isOnApp: boolean;
  }) {
    await this.userRepository.updateUserOnAppStatus({ userId, isOnApp });
  }

  async updateUserTutorialComplete({
    userId,
    hasCompletedTutorial,
  }: {
    userId: string;
    hasCompletedTutorial: boolean;
  }) {
    await this.userRepository.updateUserTutorialComplete({
      userId,
      hasCompletedTutorial,
    });
  }

  async updateUserOnboardingComplete({
    userId,
    hasCompletedOnboarding,
  }: {
    userId: string;
    hasCompletedOnboarding: boolean;
  }) {
    await this.userRepository.updateUserOnboardingComplete({
      userId,
      hasCompletedOnboarding,
    });
  }

  async canAccessUserData({
    currentUserId,
    targetUserId,
  }: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<boolean> {
    if (currentUserId === targetUserId) return true;

    const targetUser = await this.userRepository.getUser({
      userId: targetUserId,
    });
    if (!targetUser) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "Target user not found");
    }

    // Check if the current user is blocked by the target user
    const isBlocked = await this.blockRepository.getBlockedUser({
      userId: targetUserId,
      blockedUserId: currentUserId,
    });
    const isBlockedByTargetUser = await this.blockRepository.getBlockedUser({
      userId: currentUserId,
      blockedUserId: targetUserId,
    });
    if (isBlocked ?? isBlockedByTargetUser) return false;

    if (targetUser.privacySetting === "public") return true;

    const isFollowing = await this.followRepository.getFollower({
      followerId: currentUserId,
      followeeId: targetUserId,
    });
    console.log("isFollowing", isFollowing);
    if (isFollowing) return true;

    return false;
  }

  async deleteProfileFromOpenSearch({ userId }: { userId: string }) {
    await openSearch.delete({ index: OpenSearchIndex.PROFILE, id: userId });
  }
}
