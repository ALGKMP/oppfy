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
  blocked: boolean;
}

export type UpdateRelationship = Partial<
  Omit<Relationship, "userIdA" | "userIdB">
>;

export interface GetByUserIdsParams {
  userIdA: string;
  userIdB: string;
}

export interface UpsertParams {
  userIdA: string;
  userIdB: string;
  updates: UpdateRelationship;
}

export interface DeleteParams {
  userIdA: string;
  userIdB: string;
}

export interface IRelationshipRepository {
  getByUserIds(
    params: GetByUserIdsParams,
    db?: DatabaseOrTransaction,
  ): Promise<Relationship>;

  upsert(params: UpsertParams, db?: DatabaseOrTransaction): Promise<void>;

  delete(params: DeleteParams, db?: DatabaseOrTransaction): Promise<void>;
}
