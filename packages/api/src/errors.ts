/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  USER_ALREADY_FOLLOWED = "USER_ALREADY_FOLLOWED",
  USER_ALREADY_FRIENDS = "USER_ALREADY_FRIENDS",
  CANNOT_UNFOLLOW_FRIENDS = "CANNOT_UNFOLLOW_FRIENDS",
  UNREGISTERED_PUSH_TOKEN = "UNREGISTERED_PUSH_TOKEN",
  PUSH_TOKEN_NOT_FOUND = "PUSH_TOKEN_NOT_FOUND",
  FRIEND_REQUEST_NOT_FOUND = "FRIEND_REQUEST_NOT_FOUND",
  FRIEND_REQUEST_ALREADY_SENT = "FRIEND_REQUEST_ALREADY_SENT",
  FOLLOW_REQUEST_NOT_FOUND = "FOLLOW_REQUEST_NOT_FOUND",
  FRIENDSHIP_NOT_FOUND = "FRIENDSHIP_NOT_FOUND",
  RELATIONSHIP_ALREADY_EXISTS = "RELATIONSHIP_ALREADY_EXISTS",
  POST_NOT_FOUND = "POST_NOT_FOUND",
  POST_ALREADY_LIKED = "POST_ALREADY_LIKED",
  POST_NOT_LIKED = "POST_NOT_LIKED",
  PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND",
  PROFILE_INCOMPLETE = "PROFILE_INCOMPLETE",
  PROFILE_ALREADY_EXISTS = "PROFILE_ALREADY_EXISTS",
  PROFILE_PICTURE_NOT_FOUND = "PROFILE_PICTURE_NOT_FOUND",
  USERNAME_NOT_FOUND = "USERNAME_NOT_FOUND",
  USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS",
  FAILED_TO_DELETE = "FAILED_TO_DELETE",
  NOTIFICATION_SETTINGS_NOT_FOUND = "NOTIFICATION_SETTINGS_NOT_FOUND",
  FOLLOW_NOT_FOUND = "FOLLOW_NOT_FOUND",
  CANNOT_FOLLOW_SELF = "CANNOT_FOLLOW_SELF",
  CANNOT_FRIEND_SELF = "CANNOT_FRIEND_SELF",
  COMMENT_NOT_FOUND = "COMMENT_NOT_FOUND",
  FAILED_TO_CHECK_RELATIONSHIP = "FAILED_TO_CHECK_RELATIONSHIP",
  FAILED_TO_CHECK_LIKE = "FAILED_TO_CHECK_LIKE",
  FAILED_TO_COUNT_FOLLOWERS = "FAILED_TO_COUNT_FOLLOWERS",
  FAILED_TO_COUNT_FOLLOWING = "FAILED_TO_COUNT_FOLLOWING",
  FAILED_TO_COUNT_FOLLOW_REQUESTS = "FAILED_TO_COUNT_FOLLOW_REQUESTS",
  FAILED_TO_COUNT_FRIEND_REQUESTS = "FAILED_TO_COUNT_FRIEND_REQUESTS",
  FAILED_TO_REPORT_POST = "FAILED_TO_REPORT_POST",
  FAILED_TO_REPORT_COMMENT = "FAILED_TO_REPORT_COMMENT",
  FAILED_TO_REPORT_USER = "FAILED_TO_REPORT_USER",
  DATABASE_ERROR = "DATABASE_ERROR",
  AWS_ERROR = "AWS_ERROR",
  MUX_ERROR = "MUX_ERROR",
  OPENSEARCH_ERROR = "OPENSEARCH_ERROR",
}

type ErrorCodes = keyof typeof ErrorCode;

export class DomainError extends Error {
  constructor(
    public code: ErrorCodes,
    message?: string,
    public error?: unknown,
  ) {
    super(message);
  }
}

export function handleError(
  _errorType: string,
  message: string,
  code: ErrorCodes,
) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.error("Error in method:", propertyKey);
        console.error("Arguments:", args);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        throw new DomainError(code, message, error);
      }
    };
    return descriptor;
  };
}

export const handleDatabaseErrors = handleError(
  "DatabaseError",
  "Database error occurred",
  ErrorCode.DATABASE_ERROR,
);

export const handleAwsErrors = handleError(
  "AwsError",
  "AWS error occurred",
  ErrorCode.AWS_ERROR,
);

export const handleMuxErrors = handleError(
  "MuxError",
  "Mux error occurred",
  ErrorCode.MUX_ERROR,
);

export const handleOpensearchErrors = handleError(
  "OpensearchError",
  "Opensearch error occurred",
  ErrorCode.OPENSEARCH_ERROR,
);
