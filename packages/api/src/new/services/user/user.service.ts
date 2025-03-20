import { createHash } from "crypto";
import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import type { NotificationMessage } from "@oppfy/sns";
import { sns } from "@oppfy/sns";
import { sqs } from "@oppfy/sqs";

import { TYPES } from "../../container";
import { AwsErrors } from "../../errors/aws.error";
import { UserErrors } from "../../errors/user/user.error";
import type { IPostRepository } from "../../interfaces/repositories/content/postRepository.interface";
import type { IBlockRepository } from "../../interfaces/repositories/social/blockRepository.interface";
import type { IFollowRepository } from "../../interfaces/repositories/social/followRepository.interface";
import type { IRelationshipRepository } from "../../interfaces/repositories/social/relationshipRepository.interface";
import type { IContactsRepository } from "../../interfaces/repositories/user/contactsRepository.interface";
import type { INotificationsRepository } from "../../interfaces/repositories/user/notificationRepository.interface";
import type { IProfileRepository } from "../../interfaces/repositories/user/profileRepository.interface";
import type { IUserRepository } from "../../interfaces/repositories/user/userRepository.interface";
import type { IUserService } from "../../interfaces/services/user/userService.interface";
import type { User, UserStatus } from "../../models";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.Database) private db: Database,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository,
    @inject(TYPES.ProfileRepository)
    private profileRepository: IProfileRepository,
    @inject(TYPES.PostRepository) private postRepository: IPostRepository,
    @inject(TYPES.FollowRepository) private followRepository: IFollowRepository,
    @inject(TYPES.BlockRepository) private blockRepository: IBlockRepository,
    @inject(TYPES.ContactsRepository)
    private contactsRepository: IContactsRepository,
    @inject(TYPES.NotificationsRepository)
    private notificationsRepository: INotificationsRepository,
    @inject(TYPES.RelationshipRepository)
    private relationshipRepository: IRelationshipRepository,
  ) {}

  async createUserWithUsername(options: {
    userId: string;
    phoneNumber: string;
    name: string;
    isOnApp?: boolean;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId, phoneNumber, name, isOnApp = true } = options;

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

      usernameExists = await this.profileRepository.usernameTaken({
        username,
      });
    } while (usernameExists);

    await this.db.transaction(async (tx) => {
      await this.userRepository.createUser(
        {
          userId,
          phoneNumber,
          username,
          isOnApp,
          name,
        },
        tx,
      );
    });

    // Fetch and send notifications
    await this.fetchAndSendNotifications(userId);

    return ok(undefined);
  }

  async createUser(options: {
    userId: string;
    phoneNumber: string;
    isOnApp?: boolean;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId, phoneNumber, isOnApp = true } = options;

    let username;
    let usernameExists;
    do {
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 17)
        .padEnd(15, "0");
      username = "user" + randomPart;

      usernameExists = await this.profileRepository.usernameTaken({
        username,
      });
    } while (usernameExists);

    await this.db.transaction(async (tx) => {
      await this.userRepository.createUser(
        {
          userId,
          phoneNumber,
          username,
          isOnApp,
        },
        tx,
      );
    });

    return ok(undefined);
  }

  async getUser(options: {
    userId: string;
  }): Promise<Result<User, UserErrors.UserNotFound>> {
    const { userId } = options;
    const user = await this.userRepository.getUser({ userId });
    if (!user) {
      return err(new UserErrors.UserNotFound(userId));
    }
    return ok(user);
  }

  async getUserByPhoneNumber(options: {
    phoneNumber: string;
  }): Promise<Result<User, UserErrors.UserNotFound>> {
    const { phoneNumber } = options;
    const user = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });
    if (!user) {
      return err(new UserErrors.UserNotFound(phoneNumber));
    }
    return ok(user);
  }

  async getUserByPhoneNumberNoThrow(options: {
    phoneNumber: string;
  }): Promise<Result<User | undefined, never>> {
    const { phoneNumber } = options;
    const user = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });
    return ok(user);
  }

  async deleteUser(options: {
    userId: string;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId } = options;
    const user = await this.userRepository.getUser({ userId });
    if (!user) {
      return err(new UserErrors.UserNotFound(userId));
    }

    await this.db.transaction(async (tx) => {
      await this.userRepository.updateStatsOnUserDelete({ userId }, tx);
      await this.userRepository.deleteUser({ userId }, tx);
      await this.contactsRepository.deleteContacts({ userId }, tx);
    });

    const userPhoneNumberHash = createHash("sha512")
      .update(user.phoneNumber)
      .digest("hex");

    try {
      await sqs.sendContactSyncMessage({
        userId,
        userPhoneNumberHash,
        contacts: [],
      });
    } catch (error) {
      return err(
        new AwsErrors.SQSFailedToSend("Failed to send contact sync message"),
      );
    }

    return ok(undefined);
  }

  async isUserOnApp(options: {
    userId: string;
  }): Promise<Result<boolean, never>> {
    const { userId } = options;
    const userStatus = await this.userRepository.getUserStatus({ userId });
    return ok(userStatus?.isOnApp ?? false);
  }

  async completedOnboarding(options: {
    userId: string;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId } = options;
    await this.db.transaction(async (tx) => {
      await this.userRepository.updateUserOnboardingComplete(
        {
          userId,
          hasCompletedOnboarding: true,
        },
        tx,
      );
    });
    return ok(undefined);
  }

  async getUserStatus(options: {
    userId: string;
  }): Promise<Result<UserStatus, UserErrors.UserNotFound>> {
    const { userId } = options;
    const userStatus = await this.userRepository.getUserStatus({ userId });
    if (!userStatus) {
      return err(new UserErrors.UserNotFound(userId));
    }
    return ok(userStatus);
  }

  async setTutorialComplete(options: {
    userId: string;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId } = options;
    await this.db.transaction(async (tx) => {
      await this.userRepository.updateUserTutorialComplete(
        {
          userId,
          hasCompletedTutorial: true,
        },
        tx,
      );
    });
    return ok(undefined);
  }

  async isUserOnboarded(options: {
    userId: string;
  }): Promise<Result<boolean, never>> {
    const { userId } = options;
    const userStatus = await this.userRepository.getUserStatus({ userId });
    return ok(userStatus?.hasCompletedOnboarding ?? false);
  }

  async hasTutorialBeenCompleted(options: {
    userId: string;
  }): Promise<Result<boolean, never>> {
    const { userId } = options;
    const userStatus = await this.userRepository.getUserStatus({ userId });
    return ok(userStatus?.hasCompletedTutorial ?? false);
  }

  async updateUserOnAppStatus(options: {
    userId: string;
    isOnApp: boolean;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId, isOnApp } = options;
    await this.db.transaction(async (tx) => {
      await this.userRepository.updateUserOnAppStatus({ userId, isOnApp }, tx);
    });
    return ok(undefined);
  }

  async updateUserTutorialComplete(options: {
    userId: string;
    hasCompletedTutorial: boolean;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId, hasCompletedTutorial } = options;
    await this.db.transaction(async (tx) => {
      await this.userRepository.updateUserTutorialComplete(
        {
          userId,
          hasCompletedTutorial,
        },
        tx,
      );
    });
    return ok(undefined);
  }

  async updateUserOnboardingComplete(options: {
    userId: string;
    hasCompletedOnboarding: boolean;
  }): Promise<Result<void, UserErrors.UserNotFound>> {
    const { userId, hasCompletedOnboarding } = options;
    await this.db.transaction(async (tx) => {
      await this.userRepository.updateUserOnboardingComplete(
        {
          userId,
          hasCompletedOnboarding,
        },
        tx,
      );
    });
    return ok(undefined);
  }

  async canAccessUserData(options: {
    currentUserId: string;
    targetUserId: string;
  }): Promise<Result<boolean, UserErrors.UserNotFound>> {
    const { currentUserId, targetUserId } = options;

    if (currentUserId === targetUserId) {
      return ok(true);
    }

    const targetUser = await this.userRepository.getUser({
      userId: targetUserId,
    });
    if (!targetUser) {
      return err(new UserErrors.UserNotFound(targetUserId));
    }

    // Get relationship status
    const relationship = await this.relationshipRepository.getByUserIds({
      userIdA: currentUserId,
      userIdB: targetUserId,
    });

    if (relationship.blocked) {
      return ok(false);
    }

    const targetProfile = await this.profileRepository.getProfile({
      userId: targetUserId,
    });
    if (!targetProfile) {
      return err(new UserErrors.UserNotFound(targetUserId));
    }

    if (targetProfile.privacy === "public") {
      return ok(true);
    }

    return ok(relationship.followStatus === "following");
  }

  private async fetchAndSendNotifications(userId: string): Promise<void> {
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
            const pushTokens = await this.notificationsRepository.getPushTokens(
              {
                userId: authorId,
              },
            );

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
  }
}
