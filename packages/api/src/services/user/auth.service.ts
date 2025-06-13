import { inject, injectable } from "inversify";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";
import type { Twilio } from "@oppfy/twilio";
import { RestException } from "@oppfy/twilio";

import * as AuthErrors from "../../errors/user/auth.error";
import * as UserErrors from "../../errors/user/user.error";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";
import type { PhoneNumberParam } from "../../types";


interface PhoneNumberAndCodeParams {
  phoneNumber: string;
  code: string;
}

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.Twilio) private readonly twilio: Twilio,
  ) { }

  async sendVerificationCode({
    phoneNumber,
    code,
  }: PhoneNumberAndCodeParams): Promise<
    Result<void, AuthErrors.InvalidPhoneNumber | AuthErrors.RateLimitExceeded>
  > {
    try {
      await this.twilio.sendVerificationCode({ phoneNumber, code });
      return ok();
    } catch (error: unknown) {
      if (error instanceof RestException) {
        switch (error.code) {
          case 21211:
            return err(new AuthErrors.InvalidPhoneNumber());
          case 20429:
            return err(new AuthErrors.RateLimitExceeded());
          case undefined: { throw new Error('Not implemented yet: undefined case') }
        }
      }
      throw error;
    }
  }

  async finalizeAccountSetup({
    phoneNumber,
  }: PhoneNumberParam): Promise<
    Result<
      void,
      | UserErrors.UserNotFound
      | UserErrors.UserStatusNotFound
    >
  > {
    const possibleUser = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });

    if (!possibleUser) {
      await this.db.transaction(async (tx) => {
        await this.userRepository.createUser({ phoneNumber }, tx);
      });
    } else {
      const userStatus = await this.userRepository.getUserStatus({
        userId: possibleUser.id,
      });
      if (!userStatus)
        return err(new UserErrors.UserStatusNotFound(possibleUser.id));

      if (!userStatus.isOnApp) {
        await this.userRepository.updateUserOnAppStatus({
          userId: possibleUser.id,
          isOnApp: true,
        });
      }
    }

    const user = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });
    if (!user) return err(new UserErrors.UserNotFound(phoneNumber));

    return ok();
  }
}
