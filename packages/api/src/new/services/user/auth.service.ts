// services/auth.service.ts
import crypto from "crypto";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { err, ok, Result } from "neverthrow";

import type { Database } from "@oppfy/db";
import { env } from "@oppfy/env";
import type { TwilioService } from "@oppfy/twilio";

import { TYPES } from "../../container";
import * as AuthErrors from "../../errors/user/auth.error";
import type { IUserRepository } from "../../interfaces/repositories/user/user.repository.interface";
import type {
  AuthTokens,
  IAuthService,
  RefreshTokenParams,
  SendVerificationCodeParams,
  VerifyCodeParams,
} from "../../interfaces/services/user/auth.service.interface";

const ADMIN_PHONE_NUMBERS = [
  "+16478852142",
  "+16478852143",
  "+16478852144",
  "+16475504668",
  "+14107628976",
];

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
  }: SendVerificationCodeParams): Promise<Result<{ status: string }, never>> {
    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
      return ok({ status: "pending" });
    }

    const status = await this.twilio.sendVerificationCode({ phoneNumber });
    return ok({ status });
  }

  async verifyCode({
    phoneNumber,
    code,
  }: VerifyCodeParams): Promise<
    Result<
      { success: boolean; isNewUser: boolean; tokens: AuthTokens },
      AuthErrors.InvalidVerificationCode
    >
  > {
    let isValid = false;
    let isNewUser = false;

    if (ADMIN_PHONE_NUMBERS.includes(phoneNumber)) {
      if (code !== "123456") {
        return err(new AuthErrors.InvalidVerificationCode());
      }
      isValid = true;
    } else {
      isValid = await this.twilio.verifyCode({ phoneNumber, code });
      if (!isValid) {
        return err(new AuthErrors.InvalidVerificationCode());
      }
    }

    let user = await this.userRepository.getUserByPhoneNumberNoThrow({
      phoneNumber,
    });

    if (!user) {
      const userId = crypto.randomUUID();
      await this.db.transaction(async (tx) => {
        await this.userRepository.createUserOnApp(
          { userId, phoneNumber, username: phoneNumber },
          tx,
        );
      });
      user = await this.userRepository.getUserByPhoneNumber({ phoneNumber });
      isNewUser = true;
    } else {
      const isOnApp = await this.userRepository.isUserOnApp({
        userId: user.id,
      });
      if (!isOnApp) {
        await this.userRepository.updateUserOnAppStatus({
          userId: user.id,
          isOnApp: true,
        });
        isNewUser = true;
        user = await this.userRepository.getUserByPhoneNumber({ phoneNumber });
      }
    }

    const tokens = this.generateTokens(user.id);
    return ok({ success: true, isNewUser, tokens });
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
