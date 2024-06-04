import trpcFollowOutputSchema from "../output/network/follow";
import trpcProfileOutputSchema from "../output/profile/profile";
import trpcFriendOutputSchema from "./network/friend";
import trpcPostOutputSchema from "./post/post";
import trpcBlockOutputSchema from "./network/block";
import trpcRequestOutputSchema from "./network/request";

export const output = {
  profile: trpcProfileOutputSchema,
  follow: trpcFollowOutputSchema,
  friend: trpcFriendOutputSchema,
  post: trpcPostOutputSchema,
  block: trpcBlockOutputSchema,
  request: trpcRequestOutputSchema
};
