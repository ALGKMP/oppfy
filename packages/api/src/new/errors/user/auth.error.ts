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

export class InvalidPhoneNumber extends Error {
  name = "InvalidPhoneNumberError";
  constructor() {
    super("Invalid phone number");
  }
}

export class RateLimitExceeded extends Error {
  name = "RateLimitExceededError";
  constructor() {
    super("Rate limit exceeded");
  }
}
