import type { Relations } from "@oppfy/db";

export interface GetByUserIdsParams {
  userIdA: string;
  userIdB: string;
}

export interface UpsertParams {
  userIdA: string;
  userIdB: string;
  updates: Partial<Omit<Relations, "userIdA" | "userIdB" | "createdAt">>;
}

export interface DeleteParams {
  userIdA: string;
  userIdB: string;
}

export interface IRelationshipService {
  getByUserIds(params: GetByUserIdsParams): Promise<Relations | undefined>;

  upsert(params: UpsertParams): Promise<void>;

  delete(params: DeleteParams): Promise<void>;
}
