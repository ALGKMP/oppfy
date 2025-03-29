import { createBaseErrorClass } from "../errorFactory";

const UserError = createBaseErrorClass("User");

export const UserErrors = {
  UserNotFound: class extends UserError {
    constructor(userId: string) {
      super(`User with id "${userId}" not found`);
      this.name = "UserNotFoundError";
    }
  },
};

export type UserError = InstanceType<typeof UserError>;
