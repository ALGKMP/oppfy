
import { eq, or, and } from "drizzle-orm";

import { db, schema } from "@acme/db";

const friendsRepository = {
    addFriend: async (userId1: string, userId2: string) => {
      const result = await db
        .insert(schema.friend)
        .values({ userId1, userId2 })
        .execute();
      return result[0].insertId; // Assuming auto-increment ID
    },
  
    removeFriend: async (userId1: string, userId2: string) => {
      await db
        .delete(schema.friend)
        .where(or(
          and(eq(schema.friend.userId1, userId1), eq(schema.friend.userId2, userId2)),
          and(eq(schema.friend.userId1, userId2), eq(schema.friend.userId2, userId1))
        ))
        .execute();
    },
  
    getFriends: async (userId: string) => {
      const result = await db
        .select()
        .from(schema.friend)
        .where(or(eq(schema.friend.userId1, userId), eq(schema.friend.userId2, userId)))
        .execute();
      return result.map(friend => friend.userId1 === userId ? friend.userId2 : friend.userId1);
    }
  };
  
  export default friendsRepository;
  