import { createBaseErrorClass } from "../errorFactory";

const UserError = createBaseErrorClass("User");

export class UserNotFound extends UserError {
  name = "UserNotFoundError" as const;
  constructor(userId: string) {
    super(`User with id "${userId}" not found`);
  }
}

export class UserStatusNotFound extends UserError {
  name = "UserStatusNotFoundError" as const;
  constructor(userId: string) {
    super(`User status with id "${userId}" not found`);
  }
}
