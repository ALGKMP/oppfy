import { and, eq } from "drizzle-orm";

import { db, schema } from "@acme/db";

const followerRepository = {
    addFollower: async (userId: string, followerId: string) => {
        const result = await db.insert(schema.follower).values({ followedId: userId, followerId });
        return result[0].insertId; // Assuming auto-increment ID
    },
    
    removeFollower: async (userId: string, followerId: string) => {
        await db
        .delete(schema.follower)
        .where(
            and(
            eq(schema.follower.followedId, userId),
            eq(schema.follower.followerId, followerId),
            ),
        )
    },
    
    getFollowers: async (userId: string) => {
        const result = await db
        .select()
        .from(schema.follower)
        .where(
            eq(schema.follower.followedId, userId),
        )
        return result.map((follower) => follower.followerId);
    },
    
    countFollowers: async (userId: string) => {
        const result = await db
        .select()
        .from(schema.follower)
        .where(
            eq(schema.follower.followedId, userId),
        )
        return result.length;
    },
    
    countFollowing: async (userId: string) => {
        const result = await db
        .select()
        .from(schema.follower)
        .where(
            eq(schema.follower.followerId, userId),
        )
        return result.length;
    }
};

export default followerRepository;