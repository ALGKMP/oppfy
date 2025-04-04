// errors/auth.error.ts
export class InvalidVerificationCode extends Error {
  name = "InvalidVerificationCodeError";
  constructor() {
    super("Invalid verification code");
  }
}

export class InvalidRefreshToken extends Error {
  name = "InvalidRefreshTokenError";
  constructor() {
    super("Invalid refresh token");
  }
}