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

    await this.contactsRepository.updateUserContacts(userId, contacts);
  }

  async deleteContacts(userId: string) {
    const user = await this.userRepository.getUser(userId);

    if (user === undefined) {
      throw new DomainError(ErrorCode.USER_NOT_FOUND, "User not found");
    }

    await this.contactsRepository.deleteContacts(userId);
  }
}
