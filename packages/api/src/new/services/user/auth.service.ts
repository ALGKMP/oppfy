import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import type { TwilioService } from "@oppfy/twilio";
import { RestException } from "@oppfy/twilio";

import { TYPES } from "../../container";
import * as AuthErrors from "../../errors/user/auth.error";
import * as UserErrors from "../../errors/user/user.error";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  AuthTokens,
  IAuthService,
  RefreshTokenParams,
  VerifyCodeParams,
  VerifyCodeResult,
} from "../../interfaces/services/user/auth.service.interface";
import { PhoneNumberParam } from "../../interfaces/types";

const ADMIN_PHONE_NUMBERS = [
  "+16478852142",
  "+16478852143",
  "+16478852144",
  "+16475504668",
  "+14107628976",
];

const ADMIN_CODE = "123456";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(TYPES.Twilio)
    private readonly twilio: TwilioService,
  ) {}

  async sendVerificationCode({
    phoneNumber,
  }: PhoneNumberParam): Promise<
    Result<void, AuthErrors.InvalidPhoneNumber | AuthErrors.RateLimitExceeded>
  > {
    // Skip sending for admin phone numbers
    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
      return ok();
    }

    try {
      await this.twilio.sendVerificationCode({ phoneNumber });
      return ok();
    } catch (error: unknown) {
      if (error instanceof RestException) {
        switch (error.code) {
          case 21211: // Invalid phone number
            return err(new AuthErrors.InvalidPhoneNumber());
          case 20429: // Rate limit
            return err(new AuthErrors.RateLimitExceeded());
        }
      }

      throw error;
    }
  }

  async verifyCode({
    phoneNumber,
    code,
  }: VerifyCodeParams): Promise<
    Result<
      VerifyCodeResult,
      | AuthErrors.InvalidVerificationCode
      | UserErrors.UserNotFound
      | UserErrors.UserStatusNotFound
    >
  > {
    let isNewUser = false;

    // 1) Check if admin phone number
    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
      if (code !== ADMIN_CODE) {
        return err(new AuthErrors.InvalidVerificationCode());
      }
    }
    // 2) Call Twilio to verify the code
    else {
      try {
        const isValid = await this.twilio.verifyCode({ phoneNumber, code });
        if (!isValid) return err(new AuthErrors.InvalidVerificationCode());
      } catch (error: unknown) {
        if (error instanceof RestException) {
          switch (error.code) {
            case 60400:
              return err(new AuthErrors.InvalidVerificationCode());
          }
        }
        throw error;
      }
    }

    // 3) Look up user and create if necessary
    const possibleUser = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });

    // If user not found, create them
    if (possibleUser === undefined) {
      await this.db.transaction(async (tx) => {
        await this.userRepository.createUser({ phoneNumber }, tx);
      });
      isNewUser = true;
    }
    // If user exists but isn't marked "on app," update them
    else {
      const userStatus = await this.userRepository.getUserStatus({
        userId: possibleUser.id,
      });

      if (userStatus === undefined) {
        return err(new UserErrors.UserStatusNotFound(possibleUser.id));
      }

      if (!userStatus.isOnApp) {
        await this.userRepository.updateUserOnAppStatus({
          userId: possibleUser.id,
          isOnApp: true,
        });
        isNewUser = true;
      }
    }

    const user = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });
    if (user === undefined)
      return err(new UserErrors.UserNotFound(phoneNumber));

    // 4) Generate tokens, return success
    const tokens = this.generateTokens(user.id);
    return ok({ isNewUser, tokens });
  }

  refreshToken({
    refreshToken,
  }: RefreshTokenParams): Result<AuthTokens, AuthErrors.InvalidRefreshToken> {
    try {
      const { uid } = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        uid: string;
      };
      const tokens = this.generateTokens(uid);
      return ok(tokens);
    } catch {
      return err(new AuthErrors.InvalidRefreshToken());
    }
  }

  private generateTokens(uid: string): AuthTokens {
    const accessToken = jwt.sign({ uid }, env.JWT_ACCESS_SECRET, {
      expiresIn: "30m",
    });
    const refreshToken = jwt.sign({ uid }, env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });

    return { accessToken, refreshToken };
  }
}
