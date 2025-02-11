import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import type {
  DeleteMessageCommandInput,
  ReceiveMessageCommandInput,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";

import { env } from "@oppfy/env";

const client = new SQSClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const sqs = {
  client,

  async sendMessage(sendMessageCommandInput: SendMessageCommandInput) {
    const command = new SendMessageCommand(sendMessageCommandInput);
    return await client.send(command);
  },

  async receiveMessage(receiveMessageCommandInput: ReceiveMessageCommandInput) {
    const command = new ReceiveMessageCommand(receiveMessageCommandInput);
    return await client.send(command);
  },

  async deleteMessage(deleteMessageCommandInput: DeleteMessageCommandInput) {
    const command = new DeleteMessageCommand(deleteMessageCommandInput);
    return await client.send(command);
  },
};
