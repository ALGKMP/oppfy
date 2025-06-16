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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface VerifyCodeResult {
  isNewUser: boolean;
  tokens: AuthTokens;
}

const ACCESS_TOKEN_TTL_SECONDS = 30 * 60; // 30 min
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const REFRESH_ROTATE_THRESHOLD = 7 * 24 * 60 * 60; // 7 days

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.Database)
    private readonly db: Database,
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.Twilio) private readonly twilio: Twilio,
  ) {}

  /* -------------------- SMS -------------------- */

  async sendVerificationCode({
    phoneNumber,
  }: PhoneNumberParam): Promise<
    Result<void, AuthErrors.InvalidPhoneNumber | AuthErrors.RateLimitExceeded>
  > {
    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) return ok();

    try {
      await this.twilio.sendVerificationCode({ phoneNumber });
      return ok();
    } catch (error) {
      if (error instanceof RestException) {
        switch (error.code) {
          case 21211:
            return err(new AuthErrors.InvalidPhoneNumber());
          case 20429:
            return err(new AuthErrors.RateLimitExceeded());
          case undefined: {
            throw new Error("Unexpected error");
          }
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

    /* 1 ─ Check the code */
    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
      if (code !== ADMIN_CODE)
        return err(new AuthErrors.InvalidVerificationCode());
    } else {
      try {
        const okCode = await this.twilio.verifyCode({ phoneNumber, code });
        if (!okCode) return err(new AuthErrors.InvalidVerificationCode());
      } catch (e) {
        if (e instanceof RestException && e.code === 60400)
          return err(new AuthErrors.InvalidVerificationCode());
        throw e;
      }
    }

    /* 2 ─ Ensure user exists / on-app flag */
    let user = await this.userRepository.getUserByPhoneNumber({ phoneNumber });

    if (!user) {
      await this.db.transaction(async (tx) => {
        const { user: newUser } = await this.userRepository.createUser(
          { phoneNumber },
          tx,
        );
        user = newUser;
        isNewUser = true;
      });
    } else {
      const status = await this.userRepository.getUserStatus({
        userId: user.id,
      });
      if (!status) return err(new UserErrors.UserStatusNotFound(user.id));
      if (!status.isOnApp) {
        await this.userRepository.updateUserOnAppStatus({
          userId: user.id,
          isOnApp: true,
        });
        isNewUser = true;
      }
    }

    if (!user) return err(new UserErrors.UserNotFound(phoneNumber));

    /* 3 ─ Tokens */
    return ok({
      isNewUser,
      tokens: this.issueTokens(user.id),
    });
  }

  /* -------------------- JWT -------------------- */

  refreshToken({
    refreshToken,
  }: RefreshTokenParams): Result<AuthTokens, AuthErrors.InvalidRefreshToken> {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        uid: string;
        exp: number;
      };

      const rotate =
        payload.exp * 1000 - Date.now() < REFRESH_ROTATE_THRESHOLD * 1000;

      return ok({
        accessToken: this.signAccess(payload.uid),
        refreshToken: rotate ? this.signRefresh(payload.uid) : refreshToken,
      });
    } catch {
      return err(new AuthErrors.InvalidRefreshToken());
    }
  }

  /* -------------------- helpers ------------------- */

  private issueTokens(uid: string): AuthTokens {
    return {
      accessToken: this.signAccess(uid),
      refreshToken: this.signRefresh(uid),
    };
  }

  private signAccess(uid: string) {
    return jwt.sign({ uid }, env.JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  private signRefresh(uid: string) {
    return jwt.sign({ uid }, env.JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });
  }
}