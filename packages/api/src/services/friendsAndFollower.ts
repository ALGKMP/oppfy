import repositories from "../repositories";

const followService = {
    getUserStats: async (userId: string) => {
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

export default followService;