import { sqs } from "@oppfy/sqs";
import { createHash } from "crypto";
import { DomainError, ErrorCode } from "../../errors";
import { ContactsRepository, UserRepository } from "../../repositories";

export class ContactService {
  private contactsRepository = new ContactsRepository();
  private userRepository = new UserRepository();

  async syncContacts(userId: string, contacts: string[]) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    // hash the users own phone number and remove from contacts if its in there
    const userPhoneNumber = user.phoneNumber;

    const userPhoneNumberHash = createHash("sha512")
      .update(userPhoneNumber)
      .digest("hex");

    const filteredContacts = contacts.filter(
      (contact) => contact !== userPhoneNumberHash,
    );

    // update the contacts in the db
    await this.contactsRepository.updateUserContacts(userId, filteredContacts);

    try {
      await sqs.send({
        id: userId + "_contactsync_" + Date.now().toString(),
        body: JSON.stringify({ userId, userPhoneNumberHash, contacts }),
      });
    } catch (error) {
      throw new DomainError(
        ErrorCode.AWS_ERROR,
        "Failed to send sqs message to contact sync queue",
      );
    }
  }

  async deleteContacts(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.contactsRepository.deleteContacts(userId);
  }
}
