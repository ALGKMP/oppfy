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
  POST_NOT_FOUND: "POST_NOT_FOUND",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
  PROFILE_ALREADY_EXISTS: "PROFILE_ALREADY_EXISTS",
  PROFILE_PICTURE_NOT_FOUND: "PROFILE_PICTURE_NOT_FOUND",
  USERNAME_NOT_FOUND: "USERNAME_NOT_FOUND",
  USERNAME_ALREADY_EXISTS: "USERNAME_ALREADY_EXISTS",
  FAILED_TO_DELETE: "FAILED_TO_DELETE",
  NOTIFICATION_SETTINGS_NOT_FOUND: "NOTIFICATION_SETTINGS_NOT_FOUND",

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
