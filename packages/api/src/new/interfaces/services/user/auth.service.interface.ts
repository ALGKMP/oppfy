import type { Result } from "neverthrow";

import type * as AuthErrors from "../../../errors/user/auth.error";
import type * as UserErrors from "../../../errors/user/user.error";
import type { PhoneNumberParam } from "../../types";

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

export interface VerifyCodeResult {
  isNewUser: boolean;
  tokens: AuthTokens;
}

export interface IAuthService {
  sendVerificationCode(
    params: PhoneNumberParam,
  ): Promise<
    Result<void, AuthErrors.InvalidPhoneNumber | AuthErrors.RateLimitExceeded>
  >;

  verifyCode(
    params: VerifyCodeParams,
  ): Promise<
    Result<
      VerifyCodeResult,
      | AuthErrors.InvalidVerificationCode
      | UserErrors.UserNotFound
      | UserErrors.UserStatusNotFound
    >
  >;

  refreshToken(
    params: RefreshTokenParams,
  ): Result<AuthTokens, AuthErrors.InvalidRefreshToken>;
}
