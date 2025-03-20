import type { DomainError } from "../../../../errors";

export type BlockUserError = DomainError & {
  code:
    | "CANNOT_FOLLOW_SELF"
    | "RELATIONSHIP_ALREADY_EXISTS"
    | "FAILED_TO_BLOCK_USER";
};

export type UnblockUserError = DomainError & {
  code: "FAILED_TO_CHECK_RELATIONSHIP" | "FAILED_TO_UNBLOCK_USER";
};
