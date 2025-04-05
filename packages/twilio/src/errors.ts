export enum TwilioErrorCode {
  // Verification service errors
  INVALID_PARAMETER = "60200",
  INVALID_PHONE_NUMBER = "60203",
  SERVICE_NOT_FOUND = "60404",
  CAPABILITY_NOT_ENABLED = "60405",
  AUTHENTICATION_FAILED = "60401",
  FORBIDDEN = "60403",
  RATE_LIMIT_EXCEEDED = "60429",
  QUOTA_EXCEEDED = "60435",
  SERVICE_UNAVAILABLE = "60503",

  // Verification check errors
  INVALID_CODE = "20404",
  CODE_EXPIRED = "20401",
}

export class TwilioError extends Error {
  constructor(
    public code: TwilioErrorCode,
    message?: string,
  ) {
    super(message);
    this.name = "TwilioError";
  }
}
