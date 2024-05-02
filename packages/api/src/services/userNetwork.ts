import repositories from "../repositories";

const userNetworkService = {
    getUserStats: async (userId: string) => {
        try {
            const followerCount = await repositories.follower.countFollowers(userId);
            const followingCount = await repositories.follower.countFollowing(userId);
            const friendCount = await repositories.friend.friendsCount(userId);
            return { followerCount, followingCount, friendCount };
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