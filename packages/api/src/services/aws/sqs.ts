import { env } from "@oppfy/env";
import { sqs } from "@oppfy/sqs";

import { DomainError, ErrorCode } from "../../errors";

interface ContactSyncMessage {
  userId: string;
  userPhoneNumberHash: string;
  contacts: string[];
}

export class SQSService {
  async sendContactSyncMessage({
    userId,
    userPhoneNumberHash,
    contacts,
  }: ContactSyncMessage) {
    try {
      await sqs.sendMessage({
        QueueUrl: env.SQS_CONTACT_QUEUE,
        MessageBody: JSON.stringify({
          userId,
          userPhoneNumberHash,
          contacts,
        }),
      });

      return {
        success: true,
        messageId: `${userId}_contactsync_${Date.now().toString()}`,
      };
    } catch (err) {
      throw new DomainError(
        ErrorCode.SQS_FAILED_TO_SEND_MESSAGE,
        "SQS failed while trying to send contact sync message",
      );
    }
  }
}
