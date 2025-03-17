/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* 
type ErrorDomain = 'User' | 'Profile' | 'Comment' | 'Social' | 'Post';
type ErrorLayer = 'Repository' | 'Service';

// Type to ensure error names follow the pattern
type ErrorClassName<D extends ErrorDomain, L extends ErrorLayer> = `${D}${L}Error`;

// Factory function to create base error classes
export function createBaseErrorClass<D extends ErrorDomain, L extends ErrorLayer>(
  domain: D,
  layer: L
) {
  const className = `${domain}${layer}Error` as ErrorClassName<D, L>;
  
  return class extends Error {
    constructor(message: string) {
      super(message);
      this.name = className;
    }
  };
}

// Create a namespace factory for specific errors
export function createErrorNamespace<D extends ErrorDomain, L extends ErrorLayer>(
  BaseError: new (message: string) => Error
) {
  return {
    BaseError,
    NotFound: class extends BaseError {
      constructor(id: string) {
        super(`Resource not found with id ${id}`);
        this.name = 'NotFound';
      }
    },
    AlreadyExists: class extends BaseError {
      constructor(id: string) {
        super(`Resource already exists with id ${id}`);
        this.name = 'AlreadyExists';
      }
    },
    ValidationError: class extends BaseError {
      constructor(message: string) {
        super(`Validation error: ${message}`);
        this.name = 'ValidationError';
      }
    },
    DatabaseError: class extends BaseError {
      constructor(originalError: unknown) {
        super(
          originalError instanceof Error
            ? originalError.message
            : 'Unknown database error'
        );
        this.name = 'DatabaseError';
      }
    },
  };
}
 */
/* // Create all base error classes
export const UserRepositoryError = createBaseErrorClass('User', 'Repository');
export const UserServiceError = createBaseErrorClass('User', 'Service');
export const ProfileRepositoryError = createBaseErrorClass('Profile', 'Repository');
export const ProfileServiceError = createBaseErrorClass('Profile', 'Service');

// Create namespaces with specific errors
export const UserRepositoryErrors = createErrorNamespace(UserRepositoryError);
export const UserServiceErrors = createErrorNamespace(UserServiceError);
export const ProfileRepositoryErrors = createErrorNamespace(ProfileRepositoryError);
export const ProfileServiceErrors = createErrorNamespace(ProfileServiceError);
 */
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
  FAILED_TO_COUNT_FRIENDS = "FAILED_TO_COUNT_FRIENDS",
  FAILED_TO_BLOCK_USER = "FAILED_TO_BLOCK_USER",
  FAILED_TO_UNBLOCK_USER = "FAILED_TO_UNBLOCK_USER",
  FAILED_TO_REMOVE_FOLLOWER = "FAILED_TO_REMOVE_FOLLOWER",
  FAILED_TO_REMOVE_FRIEND = "FAILED_TO_REMOVE_FRIEND",
  FAILED_TO_FOLLOW_USER = "FAILED_TO_FOLLOW_USER",
  FAILED_TO_REQUEST_FOLLOW = "FAILED_TO_REQUEST_FOLLOW",
  FAILED_TO_REMOVE_FOLLOW_REQUEST = "FAILED_TO_REMOVE_FOLLOW_REQUEST",
  FAILED_TO_ADD_FRIEND = "FAILED_TO_ADD_FRIEND",
  FAILED_TO_REQUEST_FRIEND = "FAILED_TO_REQUEST_FRIEND",
  FAILED_TO_DELETE_FRIEND_REQUEST = "FAILED_TO_DELETE_FRIEND_REQUEST",
  FAILED_TO_CANCEL_FRIEND_REQUEST = "FAILED_TO_CANCEL_FRIEND_REQUEST",
  FAILED_TO_CANCLE_FOLLOW_REQUEST = "FAILED_TO_CANCLE_FOLLOW_REQUEST",
  FAILED_TO_ADD_FOLLOWER = "FAILED_TO_ADD_FOLLOWER",
  FAILED_TO_CANCEL_FOLLOW_REQUEST = "FAILED_TO_CANCEL_FOLLOW_REQUEST",
  FAILED_TO_UPDATE_PRIVACY_SETTING = "FAILED_TO_UPDATE_PRIVACY_SETTING",
  FAILED_TO_GET_PROFILE_PICTURE = "FAILED_TO_GET_PROFILE_PICTURE",
  FAILED_TO_PAGINATE_POSTS = "FAILED_TO_PAGINATE_POSTS",
  FAILED_TO_CREATE_POST = "FAILED_TO_CREATE_POST",
  FAILED_TO_EDIT_POST = "FAILED_TO_EDIT_POST",
  FAILED_TO_DELETE_POST = "FAILED_TO_DELETE_POST",
  FAILED_TO_LIKE_POST = "FAILED_TO_LIKE_POST",
  FAILED_TO_UNLIKE_POST = "FAILED_TO_UNLIKE_POST",
  FAILED_TO_ADD_COMMENT = "FAILED_TO_ADD_COMMENT",
  FAILED_TO_DELETE_COMMENT = "FAILED_TO_DELETE_COMMENT",
  FAILED_TO_PAGINATE_COMMENTS = "FAILED_TO_PAGINATE_COMMENTS",
  FAILED_TO_REPORT_POST = "FAILED_TO_REPORT_POST",
  FAILED_TO_REPORT_USER = "FAILED_TO_REPORT_USER",
  FAILED_TO_REPORT_COMMENT = "FAILED_TO_REPORT_COMMENT",
  FAILED_TO_GET_POST = "FAILED_TO_GET_POST",
  FAILED_TO_CREATE_VIEW = "FAILED_TO_CREATE_VIEW",

  S3_FAILED_TO_UPLOAD = "S3_FAILED_TO_UPLOAD",
  MUX_FAILED_TO_UPLOAD = "MUX_FAILED_TO_UPLOAD",
  SQS_FAILED_TO_SEND_MESSAGE = "SQS_FAILED_TO_SEND_MESSAGE",

  DATABASE_ERROR = "DATABASE_ERROR",
  AWS_ERROR = "AWS_ERROR",
  MUX_ERROR = "MUX_ERROR",
  OPENSEARCH_ERROR = "OPENSEARCH_ERROR",
}

