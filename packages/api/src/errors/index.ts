/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

export class DomainError extends Error {
  constructor(
    public code: string,
    message?: string,
    public error?: unknown,
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_ALREADY_FOLLOWED: "USER_ALREADY_FOLLOWED",
  USER_ALREADY_FRIENDS: "USER_ALREADY_FRIENDS",
  FRIEND_REQUEST_NOT_FOUND: "FRIEND_REQUEST_NOT_FOUND",
  FRIENDSHIP_NOT_FOUND: "FRIENDSHIP_NOT_FOUND",
  POST_NOT_FOUND: "POST_NOT_FOUND",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
  PROFILE_ALREADY_EXISTS: "PROFILE_ALREADY_EXISTS",
  PROFILE_PICTURE_NOT_FOUND: "PROFILE_PICTURE_NOT_FOUND",
  USERNAME_NOT_FOUND: "USERNAME_NOT_FOUND",
  USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
  FAILED_TO_DELETE: "FAILED_TO_DELETE",
  NOTIFICATION_SETTINGS_NOT_FOUND: "NOTIFICATION_SETTINGS_NOT_FOUND",
  FOLLOW_NOT_FOUND: "FOLLOW_NOT_FOUND",
  FAILED_TO_COUNT_FOLLOWERS: "FAILED_TO_COUNT_FOLLOWERS",
  FAILED_TO_COUNT_FOLLOWING: "FAILED_TO_COUNT_FOLLOWING",
  FAILED_TO_COUNT_FRIENDS: "FAILED_TO_COUNT_FRIENDS",
  FAILED_TO_BLOCK_USER: "FAILED_TO_BLOCK_USER",
  FAILED_TO_UNBLOCK_USER: "FAILED_TO_UNBLOCK_USER",
  FAILED_TO_REMOVE_FOLLOWER: "FAILED_TO_REMOVE_FOLLOWER",
  FAILED_TO_REMOVE_FRIEND: "FAILED_TO_REMOVE_FRIEND",
  FAILED_TO_FOLLOW_USER: "FAILED_TO_FOLLOW_USER",
  FAILED_TO_REQUEST_FOLLOW: "FAILED_TO_REQUEST_FOLLOW",
  FAILED_TO_REMOVE_FOLLOW_REQUEST: "FAILED_TO_REMOVE_FOLLOW_REQUEST",
  FAILED_TO_ADD_FRIEND: "FAILED_TO_ADD_FRIEND",
  FAILED_TO_DELETE_FRIEND_REQUEST: "FAILED_TO_DELETE_FRIEND_REQUEST",

  AWS_ERROR: "AWS_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
};

export function handleError(_errorType: string, message: string, code: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        throw new DomainError(code, message, error);
      }
    };

    return descriptor;
  };
}

export const handleDatabaseErrors = handleError(
  "DatabaseError",
  "Database error occurred",
  ErrorCodes.DATABASE_ERROR,
);

export const handleAwsErrors = handleError(
  "AwsError",
  "AWS error occurred",
  ErrorCodes.AWS_ERROR,
);
