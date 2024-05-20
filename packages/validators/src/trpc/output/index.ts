import trpcProfileOutputSchema from "../output/profile/profile";
import trpcFollowOutputSchema from "../output/network/follow";
import trpcFriendOutputSchema from "./network/friend";

export const output = {
  profile: trpcProfileOutputSchema,
  follow: trpcFollowOutputSchema,
  friend: trpcFriendOutputSchema,
};
