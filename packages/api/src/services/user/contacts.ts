import { DomainError, ErrorCode } from "../../errors";
import { ContactsRepository, UserRepository } from "../../repositories";
import { Producer } from 'sqs-producer';
import { SQSClient } from '@aws-sdk/client-sqs'; 

export class ContactService {
  private contactsRepository = new ContactsRepository();
  private userRepository = new UserRepository();
  private producer: Producer;

  constructor() {
    this.producer = Producer.create({
      queueUrl: process.env.SQS_CONTACT_QUEUE!,
      sqs: new SQSClient({ region: process.env.AWS_REGION }),
    });
  }

  async syncContacts(userId: string, contacts: string[]) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    // update the contacts in the db
    await this.contactsRepository.updateUserContacts(userId, contacts);

    // insert these contacts into the queue to be proccessed by the lambda
    await this.producer.send({
      id: userId + "_contactsync_" + Date.now().toString(),
      body: JSON.stringify({ userId, contacts }),
    });
  }

  async deleteContacts(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.contactsRepository.deleteContacts(userId);
  }
}
