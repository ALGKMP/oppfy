import { createBaseErrorClass } from "../errorFactory";

const BlockError = createBaseErrorClass("Block");

export namespace BlockErrors {
  export class CannotBlockSelf extends BlockError {
    constructor() {
      super("Cannot block yourself");
    }
  }

  export class AlreadyBlocked extends BlockError {
    constructor() {
      super("User is already blocked");
    }
  }

  export class BlockNotFound extends BlockError {
    constructor() {
      super("Block relationship not found");
    }
  }
}
