import { createBaseErrorClass } from "../errorFactory";

const ProfileError = createBaseErrorClass("Profile");

export class ProfileNotFound extends ProfileError {
  name = "ProfileNotFoundError" as const;
  constructor(userId: string) {
    super(`Profile not found for user ${userId}`);
  }
}

export class StatsNotFound extends ProfileError {
  name = "StatsNotFoundError" as const;
  constructor(userId: string) {
    super(`Stats not found for user ${userId}`);
  }
}

export class ProfileBlocked extends ProfileError {
  name = "ProfileBlockedError" as const;
  constructor(userId: string) {
    super(`Profile is blocked for user ${userId}`);
  }
}

export class CannotCheckRelationshipWithSelf extends ProfileError {
  name = "CannotCheckRelationshipWithSelfError" as const;
  constructor() {
    super(`Cannot check relationship with self`);
  }
}

export class UsernameTaken extends ProfileError {
  name = "UsernameTakenError" as const;
  constructor(username: string) {
    super(`Username "${username}" is already taken`);
  }
}

export class ProfilePrivate extends ProfileError {
  name = "ProfilePrivateError" as const;
  constructor(userId: string) {
    super(`Profile is private for user ${userId}`);
  }
}
