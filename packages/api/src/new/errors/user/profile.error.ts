import { createBaseErrorClass } from "../errorFactory";

const ProfileError = createBaseErrorClass("Profile");

export namespace ProfileErrors {
  export class ProfileNotFound extends ProfileError {
    constructor(userId: string) {
      super(`Profile not found for user ${userId}`);
    }
  }
}
