import { env } from "@oppfy/env";

import { DomainError, ErrorCode } from "../../errors";
import { SQSRepository } from "../../repositories/aws/sqs";

interface ContactSyncMessage {
  userId: string;
  userPhoneNumberHash: string;
  contacts: string[];
}

export class SQSService {
  private sqsRepository = new SQSRepository();

  async sendContactSyncMessage({
    userId,
    userPhoneNumberHash,
    contacts,
  }: ContactSyncMessage) {
    try {
      const messageId = `${userId}_contactsync_${Date.now().toString()}`;
      
      await this.sqsRepository.sendMessage({
        QueueUrl: env.SQS_CONTACT_QUEUE,
        MessageBody: JSON.stringify({
          userId,
          userPhoneNumberHash,
          contacts,
        }),
        MessageGroupId: messageId, // Optional: Useful for FIFO queues
        MessageDeduplicationId: messageId, // Optional: Useful for FIFO queues
      });

      return { success: true, messageId };
    } catch (err) {
      throw new DomainError(
        ErrorCode.SQS_FAILED_TO_SEND_MESSAGE,
        "SQS failed while trying to send contact sync message",
      );
    }
  }
}
