import { createBaseErrorClass } from "../errorFactory";

const AuthError = createBaseErrorClass("Auth");

export class InvalidVerificationCode extends AuthError {
  name = "InvalidVerificationCodeError" as const;
  constructor() {
    super("Invalid verification code");
  }
}

export class InvalidRefreshToken extends AuthError {
  name = "InvalidRefreshTokenError" as const;
  constructor() {
    super("Invalid refresh token");
  }
}

export class InvalidPhoneNumber extends AuthError {
  name = "InvalidPhoneNumberError" as const;
  constructor() {
    super("Invalid phone number");
  }
}

export class RateLimitExceeded extends AuthError {
  name = "RateLimitExceededError" as const;
  constructor() {
    super("Rate limit exceeded");
  }
}
