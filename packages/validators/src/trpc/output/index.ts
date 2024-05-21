import trpcFollowOutputSchema from "../output/network/follow";
import trpcProfileOutputSchema from "../output/profile/profile";
import trpcFriendOutputSchema from "./network/friend";
import trpcPostOutputSchema from "./post/post";

export const output = {
  profile: trpcProfileOutputSchema,
  follow: trpcFollowOutputSchema,
  friend: trpcFriendOutputSchema,
  post: trpcPostOutputSchema,
};
