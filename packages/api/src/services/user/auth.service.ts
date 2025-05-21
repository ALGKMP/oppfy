import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import type { Twilio } from "@oppfy/twilio";
import { RestException } from "@oppfy/twilio";

import * as AuthErrors from "../../errors/user/auth.error";
import * as UserErrors from "../../errors/user/user.error";
import { UserRepository } from "../../repositories/user/user.repository";
import { TYPES } from "../../symbols";
import type { PhoneNumberParam } from "../../types";

const ADMIN_PHONE_NUMBERS = [
  "+16478852142",
  "+16478852143",
  "+16478852144",
  "+16475504668",
  "+14107628976",
  "+14434104494",
];

const ADMIN_CODE = "123456";

interface VerifyCodeParams {
  phoneNumber: string;
  code: string;
}

interface RefreshTokenParams {
  refreshToken: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface VerifyCodeResult {
  isNewUser: boolean;
  tokens: AuthTokens;
}

// Token lifetimes — tweak as desired
const ACCESS_TOKEN_TTL = "15m"; // shorter‑lived access tokens
const REFRESH_TOKEN_TTL = "30d";

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.Database) private readonly db: Database,
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.Twilio) private readonly twilio: Twilio,
  ) {}

  // ------------------------------ SMS Flow ---------------------------------

  async sendVerificationCode({
    phoneNumber,
  }: PhoneNumberParam): Promise<
    Result<void, AuthErrors.InvalidPhoneNumber | AuthErrors.RateLimitExceeded>
  > {
    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) return ok();

    try {
      await this.twilio.sendVerificationCode({ phoneNumber });
      return ok();
    } catch (error: unknown) {
      if (error instanceof RestException) {
        switch (error.code) {
          case 21211:
            return err(new AuthErrors.InvalidPhoneNumber());
          case 20429:
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

    // 1 — Verify code (admin shortcut or Twilio)
    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
      if (code !== ADMIN_CODE)
        return err(new AuthErrors.InvalidVerificationCode());
    } else {
      try {
        const isValid = await this.twilio.verifyCode({ phoneNumber, code });
        if (!isValid) return err(new AuthErrors.InvalidVerificationCode());
      } catch (error: unknown) {
        if (error instanceof RestException && error.code === 60400) {
          return err(new AuthErrors.InvalidVerificationCode());
        }
        throw error;
      }
    }

    // 2 — Ensure user exists / on‑app
    const possibleUser = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });

    if (!possibleUser) {
      await this.db.transaction(async (tx) => {
        await this.userRepository.createUser({ phoneNumber }, tx);
      });
      isNewUser = true;
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
        isNewUser = true;
      }
    }

    const user = await this.userRepository.getUserByPhoneNumber({
      phoneNumber,
    });
    if (!user) return err(new UserErrors.UserNotFound(phoneNumber));

    // 3 — Issue tokens
    const tokens = this.generateTokens(user.id);
    return ok({ isNewUser, tokens });
  }

  // ------------------------------ JWT Flow ----------------------------------

  refreshToken({
    refreshToken,
  }: RefreshTokenParams): Result<AuthTokens, AuthErrors.InvalidRefreshToken> {
    try {
      const { uid, exp } = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        uid: string;
        exp: number;
      };

      // Optionally: rotate refresh tokens only if < 7 days remaining
      const msLeft = exp * 1000 - Date.now();
      const rotate = msLeft < 7 * 24 * 60 * 60 * 1000;

      const newAccess = this.createAccessToken(uid);
      const newRefresh = rotate ? this.createRefreshToken(uid) : refreshToken;

      return ok({ accessToken: newAccess, refreshToken: newRefresh });
    } catch {
      return err(new AuthErrors.InvalidRefreshToken());
    }
  }

  private generateTokens(uid: string): AuthTokens {
    return {
      accessToken: this.createAccessToken(uid),
      refreshToken: this.createRefreshToken(uid),
    };
  }

  private createAccessToken(uid: string): string {
    return jwt.sign({ uid }, env.JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL,
    });
  }

  private createRefreshToken(uid: string): string {
    return jwt.sign({ uid }, env.JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_TTL,
    });
  }
}
