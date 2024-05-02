import repositories from "../repositories";

const userNetworkService = {
    friendCount : async (userId: string) => {
        try {
            return await repositories.friend.friendsCount(userId);
        } catch (error) {
            console.error(
                "Error getting user stats:",
                userId,
                error instanceof Error ? error.message : error,
            );
            throw new Error("Failed to get user stats.");
        }
    },

    getFollowStats: async (userId: string) => {
        try {
            const followersCount = await repositories.follower.countFollowers(userId);
            const followingCount = await repositories.follower.countFollowing(userId);
            return { followersCount, followingCount };
        } catch (error) {
            console.error(
                "Error getting user stats:",
                userId,
                error instanceof Error ? error.message : error,
            );
            throw new Error("Failed to get user stats.");
        }
    },

}

export default userNetworkService;