import { DomainError, ErrorCode } from "../../errors";
import { UserRepository } from "../../repositories/user";

import {  schema } from "@oppfy/db";
import type { InferInsertModel } from "@oppfy/db/";

export type PrivacySettings = NonNullable<
  InferInsertModel<typeof schema.user>["privacySetting"]
>;

export class PrivacyService {
  private userRepository = new UserRepository();

  async getPrivacySettings(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, 'User not found');
    }
    return user.privacySetting;
  }

  async updatePrivacySettings(userId: string, newPrivacySetting: PrivacySettings) {
    const userExists = await this.userRepository.getUser(userId);
    if (!userExists) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, 'User not found');
    }
    const updatedPrivacy = await this.userRepository.updatePrivacySetting(userId, newPrivacySetting);
    if (!updatedPrivacy) {
      throw new DomainError(ErrorCode.FAILED_TO_UPDATE_PRIVACY_SETTING, 'Failed to update privacy settings');
    }
  }
}
