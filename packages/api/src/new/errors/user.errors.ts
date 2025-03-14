export class UserRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserRepositoryError";
  }
}

export class UserNotFoundError extends UserRepositoryError {
  constructor(userId: string) {
    super(`User not found with ID ${userId}`);
    this.name = "UserNotFoundError";
  }
}

export class UserStatusNotFoundError extends UserRepositoryError {
  constructor(userId: string) {
    super(`User status not found for user ${userId}`);
    this.name = "UserStatusNotFoundError";
  }
}

export class UserProfileNotFoundError extends UserRepositoryError {
  constructor(userId: string) {
    super(`User profile not found for user ${userId}`);
    this.name = "UserProfileNotFoundError";
  }
}

export class UserCreationError extends UserRepositoryError {
  constructor(message: string) {
    super(`Failed to create user: ${message}`);
    this.name = "UserCreationError";
  }
}

export class PhoneNumberNotFoundError extends UserRepositoryError {
  constructor(phoneNumber: string) {
    super(`User not found with phone number ${phoneNumber}`);
    this.name = "PhoneNumberNotFoundError";
  }
}
