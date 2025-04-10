import { Twilio as TwilioClient } from "twilio";
import RestException from "twilio/lib/base/RestException";

import { env } from "@oppfy/env";

type Status =
  | "pending"
  | "approved"
  | "canceled"
  | "max_attempts_reached"
  | "deleted"
  | "failed"
  | "expired";

export class Twilio {
  private client: TwilioClient;

  constructor() {
    this.client = new TwilioClient(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendVerificationCode({
    phoneNumber,
  }: {
    phoneNumber: string;
  }): Promise<void> {
    await this.client.verify.v2
      .services(env.TWILIO_SERVICE_SID)
      .verifications.create({ to: phoneNumber, channel: "sms" });
  }

  async verifyCode({
    phoneNumber,
    code,
  }: {
    phoneNumber: string;
    code: string;
  }): Promise<boolean> {
    const verificationCheck = await this.client.verify.v2
      .services(env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });

    const status = verificationCheck.status as unknown as Status;

    return status === "approved";
  }
}

export { RestException };
