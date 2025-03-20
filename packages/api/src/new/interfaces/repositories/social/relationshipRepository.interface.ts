import type { DatabaseOrTransaction, FriendStatus, FollowStatus } from "@oppfy/db";

export interface Relationship {
  userIdA: string;
  userIdB: string;
  friendshipStatus: FriendStatus;
  followStatus: FollowStatus;
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
