import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  type DeleteMessageCommandInput,
  type ReceiveMessageCommandInput,
  type SendMessageCommandInput,
} from "@aws-sdk/client-sqs";

import { sqs } from "@oppfy/sqs";

import { handleAwsErrors } from "../../errors";

export type {
  SendMessageCommandInput,
  ReceiveMessageCommandInput,
  DeleteMessageCommandInput,
};

export class SQSRepository {
  @handleAwsErrors
  async sendMessage(sendMessageCommandInput: SendMessageCommandInput) {
    const command = new SendMessageCommand(sendMessageCommandInput);
    return await sqs.send(command);
  }

  @handleAwsErrors
  async receiveMessage(receiveMessageCommandInput: ReceiveMessageCommandInput) {
    const command = new ReceiveMessageCommand(receiveMessageCommandInput);
    return await sqs.send(command);
  }

  @handleAwsErrors
  async deleteMessage(deleteMessageCommandInput: DeleteMessageCommandInput) {
    const command = new DeleteMessageCommand(deleteMessageCommandInput);
    return await sqs.send(command);
  }
}
