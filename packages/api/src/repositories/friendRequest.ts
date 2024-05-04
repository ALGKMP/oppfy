import { and, eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

import { handleDatabaseErrors } from "../errors";

export class FriendRequestRepository {
  private db = db;

  @handleDatabaseErrors
  async sendFriendRequest(requesterId: string, requestedId: string) {
    return await this.db
      .insert(schema.friendRequest)
      .values({ requesterId, requestedId, status: "pending" })
      .execute();
  }

  @handleDatabaseErrors
  async acceptFriendRequest(requesterId: string, requestedId: string) {
    await this.db
      .update(schema.friendRequest)
      .set({ status: "accepted" })
      .where(
        and(
          eq(schema.friendRequest.requesterId, requesterId),
          eq(schema.friendRequest.requestedId, requestedId),
        ),
      );
  }

  @handleDatabaseErrors
  async rejectFriendRequest(requesterId: string, requestedId: string) {
    await this.db
      .update(schema.friendRequest)
      .set({ status: "declined" })
      .where(
        and(
          eq(schema.friendRequest.requesterId, requesterId),
          eq(schema.friendRequest.requestedId, requestedId),
        ),
      );
  }

  @handleDatabaseErrors
  async getPendingRequests(userId: string) {
    return await this.db
      .select()
      .from(schema.friendRequest)
      .where(
        and(
          eq(schema.friendRequest.requestedId, userId),
          eq(schema.friendRequest.status, "pending"),
        ),
      );
  }
}
