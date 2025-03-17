import { createBaseErrorClass } from "../errorFactory";



const UserError = createBaseErrorClass("User");

export namespace UserErrors {
  export class UserNotFound extends UserError {
    constructor() {
      super("User not found");
      this.name = "UserNotFoundError";
    }
  }
}
