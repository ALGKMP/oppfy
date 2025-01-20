import { TRPCError } from "@trpc/server";

import { PendingUserRepository } from "../../repositories/user/pendingUser";

const PHONE_NUMBER_REGEX = /^\+[1-9]\d{1,14}$/; // E.164 format

export class PendingUserService {
  private pendingUserRepository = new PendingUserRepository();

  async validatePhoneNumber(phoneNumber: string) {
    if (!PHONE_NUMBER_REGEX.test(phoneNumber)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Invalid phone number format. Please use international format (e.g., +1234567890)",
      });
    }
  }

  async createOrGetPendingUser({ phoneNumber }: { phoneNumber: string }) {
    await this.validatePhoneNumber(phoneNumber);

    // Check if pending user exists
    let pendingUserRecord =
      await this.pendingUserRepository.findByPhoneNumber(phoneNumber);

    // If no pending user exists, create one
    if (!pendingUserRecord) {
      pendingUserRecord = await this.pendingUserRepository.create({
        phoneNumber,
      });
    }

    return pendingUserRecord;
  }

  async checkForPendingPosts(phoneNumber: string) {
    const pendingUserRecord =
      await this.pendingUserRepository.findByPhoneNumber(phoneNumber);

    if (!pendingUserRecord) {
      return {
        hasPendingPosts: false,
        pendingUserId: null,
      };
    }

    const posts = await this.pendingUserRepository.findPostsByPendingUserId(
      pendingUserRecord.id,
    );

    return {
      hasPendingPosts: posts.length > 0,
      pendingUserId: pendingUserRecord.id,
      postCount: posts.length,
    };
  }

  async updateUserPendingPostsStatus(userId: string, postCount: number) {
    await this.pendingUserRepository.updateUserPendingPostsStatus(
      userId,
      postCount,
    );
  }

  async getPendingPostsForUser(userId: string) {
    return this.pendingUserRepository.findPostsByPhoneNumber(userId);
  }

  async migratePendingUserPosts({
    pendingUserId,
    newUserId,
  }: {
    pendingUserId: string;
    newUserId: string;
  }) {
    return this.pendingUserRepository.migratePosts({
      pendingUserId,
      newUserId,
    });
  }
}
