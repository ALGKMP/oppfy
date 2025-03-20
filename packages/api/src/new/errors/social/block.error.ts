import { DomainError, ErrorCode } from "../../../../errors";

export namespace BlockErrors {
  export class CannotBlockSelf extends DomainError {
    constructor() {
      super(ErrorCode.CANNOT_FOLLOW_SELF, "Cannot block yourself");
    }
  }

  export class AlreadyBlocked extends DomainError {
    constructor() {
      super(ErrorCode.RELATIONSHIP_ALREADY_EXISTS, "User is already blocked");
    }
  }

  export class BlockNotFound extends DomainError {
    constructor() {
      super(
        ErrorCode.FAILED_TO_CHECK_RELATIONSHIP,
        "Block relationship not found",
      );
    }
  }

  export class FailedToBlock extends DomainError {
    constructor(error: unknown) {
      super(ErrorCode.FAILED_TO_BLOCK_USER, "Failed to block user", error);
    }
  }

  export class FailedToUnblock extends DomainError {
    constructor(error: unknown) {
      super(ErrorCode.FAILED_TO_UNBLOCK_USER, "Failed to unblock user", error);
    }
  }

  export class FailedToCheckBlock extends DomainError {
    constructor(error: unknown) {
      super(
        ErrorCode.FAILED_TO_CHECK_RELATIONSHIP,
        "Failed to check block relationship",
        error,
      );
    }
  }

  export class FailedToGetBlockedUsers extends DomainError {
    constructor(error: unknown) {
      super(ErrorCode.DATABASE_ERROR, "Failed to get blocked users", error);
    }
  }
}
