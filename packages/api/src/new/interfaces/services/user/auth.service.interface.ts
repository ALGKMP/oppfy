// interfaces/services/auth.service.interface.ts
import type { Result } from "neverthrow";

import type * as AuthErrors from "../../../errors/user/auth.error";

export interface SendVerificationCodeParams {
  phoneNumber: string;
}

export interface VerifyCodeParams {
  phoneNumber: string;
  code: string;
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthService {
  sendVerificationCode(
    params: SendVerificationCodeParams,
  ): Promise<Result<{ status: string }, never>>;

  verifyCode(
    params: VerifyCodeParams,
  ): Promise<
    Result<
      { success: boolean; isNewUser: boolean; tokens: AuthTokens },
      AuthErrors.InvalidVerificationCode
    >
  >;

  refreshToken(
    params: RefreshTokenParams,
  ): Result<AuthTokens, AuthErrors.InvalidRefreshToken>;
}
