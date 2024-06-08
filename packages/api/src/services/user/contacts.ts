import { DomainError, ErrorCode } from "../../errors";
import { UserRepository } from "../../repositories";

export class ContactService {
    private userRepository = new UserRepository();

    async syncContacts(userId: string, contacts: string[]) {
        const user = await this.userRepository.getUser(userId);

        if (user === undefined) {
            throw new DomainError(ErrorCode.USER_NOT_FOUND);
        }

        await this.userRepository.updateUserContacts(userId, contacts);
    };
}