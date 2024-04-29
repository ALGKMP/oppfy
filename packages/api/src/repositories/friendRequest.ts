import { eq, and } from "drizzle-orm";

import { db, schema } from "@acme/db";

const friendRequestRepository = {
    sendFriendRequest: async (requesterId: string, requestedId: string) => {
      const result = await db
        .insert(schema.friendRequest)
        .values({ requesterId, requestedId, status: "pending" })
        .execute();
      return result[0].insertId; 
    },
  
    acceptFriendRequest: async (requesterId: string, requestedId: string) => {
      await db
        .update(schema.friendRequest)
        .set({ status: "accepted" })
        .where(and(eq(schema.friendRequest.requesterId, requesterId), eq(schema.friendRequest.requestedId, requestedId)))
        .execute();
  
      // This can go into a service: optionally add to friends table automatically upon acceptance
    //   await friendsRepository.addFriend(requesterId, requestedId);
    },
  
    rejectFriendRequest: async (requesterId: string, requestedId: string) => {
      await db
        .update(schema.friendRequest)
        .set({ status: "declined" })
        .where(and(eq(schema.friendRequest.requesterId, requesterId), eq(schema.friendRequest.requestedId, requestedId)))
        .execute();
    },
  
    getPendingRequests: async (userId: string) => {
      const result = await db
        .select()
        .from(schema.friendRequest)
        .where(and(eq(schema.friendRequest.requestedId, userId), eq(schema.friendRequest.status, "pending")))
        .execute();
      return result;
    }
  };
  
  export default friendRequestRepository;
  