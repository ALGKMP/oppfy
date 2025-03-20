import type { FollowStatus, FriendStatus } from "@oppfy/db";

export interface Relationship {
  userIdA: string;
  userIdB: string;
  friendshipStatus: FriendStatus;
  followStatus: FollowStatus;
  blockStatus: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateRelationship = Partial<
  Omit<Relationship, "userIdA" | "userIdB" | "createdAt">
>;

export interface IRelationshipService {
  getByUserIds(options: {
    userIdA: string;
    userIdB: string;
  }): Promise<Relationship | undefined>;

  upsert(options: {
    userIdA: string;
    userIdB: string;
    updates: UpdateRelationship;
  }): Promise<void>;

  delete(options: { userIdA: string; userIdB: string }): Promise<void>;
}
