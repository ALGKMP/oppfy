import trpcProfileOutputSchema from "../output/profile/profile";
import trpcFollowOutputSchema from "../output/network/follow";
import trpcFriendOutputSchema from "./network/friend";
import trpcPostOutputSchema from "./post/post";
import trpcBlockOutputSchema from "./network/block";

export const output = {
  profile: trpcProfileOutputSchema,
  follow: trpcFollowOutputSchema,
  friend: trpcFriendOutputSchema,
  post: trpcPostOutputSchema,
  block: trpcBlockOutputSchema
};
