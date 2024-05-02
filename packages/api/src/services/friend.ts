import repositories from "../repositories";

const friendService = {
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
}

export default friendService;