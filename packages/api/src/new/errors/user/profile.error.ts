import { createBaseErrorClass } from "../errorFactory";

const ProfileError = createBaseErrorClass("Profile");

export const ProfileErrors = {
  ProfileNotFound: class extends ProfileError {
    constructor(userId: string) {
      super(`Profile not found for user ${userId}`);
    }
  },

  StatsNotFound: class extends ProfileError {
    constructor(userId: string) {
      super(`Stats not found for user ${userId}`);
    }
  },

  ProfileBlocked: class extends ProfileError {
    constructor(userId: string) {
      super(`Profile is blocked for user ${userId}`);
    }
  },

  UsernameTaken: class extends ProfileError {
    constructor(username: string) {
      super(`Username "${username}" is already taken`);
    }
  },

  ProfilePrivate: class extends ProfileError {
    constructor(userId: string) {
      super(`Profile is private for user ${userId}`);
    }
  },
};

export type ProfileError = InstanceType<typeof ProfileError>;
