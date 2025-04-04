import { TRPCError } from "@trpc/server";
import { Twilio } from "twilio";

import { env } from "@oppfy/env";

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

export class TwilioService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  private handleTwilioError(error: unknown): never {
    console.error("Twilio error:", error);

    if (error && typeof error === "object" && "code" in error) {
      const code = String(error.code);

      switch (code) {
        case TwilioErrorCode.INVALID_PARAMETER:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Invalid parameter. Please check your input and try again.",
          });
        case TwilioErrorCode.INVALID_PHONE_NUMBER:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Invalid phone number format. Please use a valid phone number.",
          });
        case TwilioErrorCode.SERVICE_NOT_FOUND:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Service not found. Please try again later.",
          });
        case TwilioErrorCode.CAPABILITY_NOT_ENABLED:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "This capability is not enabled. Please contact support.",
          });
        case TwilioErrorCode.AUTHENTICATION_FAILED:
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication failed. Please try again later.",
          });
        case TwilioErrorCode.FORBIDDEN:
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied. Please try again later.",
          });
        case TwilioErrorCode.RATE_LIMIT_EXCEEDED:
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many attempts. Please try again later.",
          });
        case TwilioErrorCode.QUOTA_EXCEEDED:
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "SMS quota exceeded. Please try again later.",
          });
        case TwilioErrorCode.SERVICE_UNAVAILABLE:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Service temporarily unavailable. Please try again later.",
          });
        case TwilioErrorCode.INVALID_CODE:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Incorrect verification code. Please try again.",
          });
        case TwilioErrorCode.CODE_EXPIRED:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "The verification code has expired. Please request a new code.",
          });
        default:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unknown error occurred. Please try again later.",
          });
      }
    }

    // Network or other unexpected errors
    if (error instanceof Error && error.message === "NETWORK_REQUEST_FAILED") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Network error. Please check your connection and try again.",
      });
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unknown error occurred. Please try again later.",
    });
  }

  async sendVerificationCode({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<string> {
    try {
      const verification = await this.client.verify.v2
        .services(env.TWILIO_SERVICE_SID)
        .verifications.create({ to: phoneNumber, channel: "sms" });

      return verification.status;
    } catch (error) {
      this.handleTwilioError(error);
    }
  }

  async verifyCode({
    phoneNumber,
    code,
  }: {
    phoneNumber: string;
    code: string;
  }): Promise<boolean> {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(env.TWILIO_SERVICE_SID)
        .verificationChecks.create({ to: phoneNumber, code });

      return verificationCheck.status === "approved";
    } catch (error) {
      this.handleTwilioError(error);
    }
  }
}

// Export a singleton instance
export const twilio = new TwilioService();
