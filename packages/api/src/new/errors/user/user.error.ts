import { createBaseErrorClass } from "../errorFactory";

const UserError = createBaseErrorClass("User");

export class UserNotFound extends UserError {
  constructor(userId: string) {
    super(`User with id "${userId}" not found`);
    this.name = "UserNotFoundError";
  }
}
