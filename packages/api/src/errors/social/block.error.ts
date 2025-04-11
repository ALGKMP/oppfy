import { createBaseErrorClass } from "../errorFactory";

const BlockError = createBaseErrorClass("Block");

export class CannotBlockSelf extends BlockError {
  name = "CannotBlockSelfError" as const;
  constructor(blockerId: string) {
    super(`User ${blockerId} cannot block themselves`);
  }
}

export class AlreadyBlocked extends BlockError {
  name = "AlreadyBlockedError" as const;
  constructor(blockerId: string, blockedId: string) {
    super(`User ${blockerId} is already blocked by user ${blockedId}`);
  }
}

export class BlockNotFound extends BlockError {
  name = "BlockNotFoundError" as const;
  constructor(blockerId: string, blockedId: string) {
    super(
      `Block relationship between user ${blockerId} and user ${blockedId} not found`,
    );
  }
}
