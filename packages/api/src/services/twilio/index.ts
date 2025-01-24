import { Twilio } from "twilio";

import { env } from "@oppfy/env";

export class TwilioService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN, {});
  }

  async sendVerificationCode(phoneNumber: string): Promise<string> {
    try {
      const verification = await this.client.verify.v2
        .services(env.TWILIO_SERVICE_SID)
        .verifications.create({ to: phoneNumber, channel: "sms" });

      return verification.status;
    } catch (error) {
      console.error("Error sending verification code:", error);
      throw error;
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const verificationCheck = await this.client.verify.v2
        .services(env.TWILIO_SERVICE_SID)
        .verificationChecks.create({ to: phoneNumber, code });

      return verificationCheck.status === "approved";
    } catch (error) {
      console.error("Error verifying code:", error);
      throw error;
    }
  }
}
