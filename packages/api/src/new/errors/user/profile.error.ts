import { createBaseErrorClass } from "../errorFactory";

const ProfileError = createBaseErrorClass("Profile");

export namespace ProfileErrors {
  export class ProfileNotFound extends ProfileError {
    constructor(userId: string) {
      super(`Profile not found for user ${userId}`);
    }
  }

  export class StatsNotFound extends ProfileError {
    constructor(userId: string) {
      super(`Stats not found for user ${userId}`);
    }
  }

  export class ProfileBlocked extends ProfileError {
    constructor(userId: string) {
      super(`Profile is blocked for user ${userId}`);
    }
  }

  export class UsernameTaken extends ProfileError {
    constructor(username: string) {
      super(`Username "${username}" is already taken`);
    }
  }

  export class ProfilePrivate extends ProfileError {
    constructor(userId: string) {
      super(`Profile is private for user ${userId}`);
    }
  }
}

export type ProfileError = InstanceType<typeof ProfileError>;
