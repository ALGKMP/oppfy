import type {
  DatabaseOrTransaction,
  followStatusEnum,
  friendStatusEnum,
} from "@oppfy/db";

export interface Relationship {
  userIdA: string;
  userIdB: string;
  friendshipStatus: (typeof friendStatusEnum.enumValues)[number];
  followStatus: (typeof followStatusEnum.enumValues)[number];
  blockStatus: boolean;
}

export type UpdateRelationship = Partial<
  Omit<Relationship, "userIdA" | "userIdB">
>;

export interface IRelationshipRepository {
  getByUserIds(
    userIdA: string,
    userIdB: string,
    tx?: DatabaseOrTransaction,
  ): Promise<Relationship | undefined>;

  upsert(
    userIdA: string,
    userIdB: string,
    updates: UpdateRelationship,
    tx?: DatabaseOrTransaction,
  ): Promise<void>;

  delete(
    userIdA: string,
    userIdB: string,
    tx?: DatabaseOrTransaction,
  ): Promise<void>;
}
