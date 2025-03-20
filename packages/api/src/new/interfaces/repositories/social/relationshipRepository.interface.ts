import type {
  DatabaseOrTransaction,
  FollowStatus,
  FriendStatus,
} from "@oppfy/db";

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
  getByUserIds({
    userIdA ,
    userIdB,
    db,
  }: {
    userIdA: string;
    userIdB: string;
    db?: DatabaseOrTransaction;
  }): Promise<Relationship | undefined>;

  upsert({
    userIdA,
    userIdB,
    updates,
    db,
  }: {
    userIdA: string;
    userIdB: string;
    updates: UpdateRelationship;
    db?: DatabaseOrTransaction;
  }): Promise<void>;

  delete({
    userIdA,
    userIdB,
    db,
  }: {
    userIdA: string;
    userIdB: string;
    db?: DatabaseOrTransaction;
  }): Promise<void>;
}
