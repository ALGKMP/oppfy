import trpcFollowOutputSchema from "../output/network/follow";
import trpcProfileOutputSchema from "../output/profile/profile";
import trpcBlockOutputSchema from "./network/block";
import trpcFriendOutputSchema from "./network/friend";
import trpcRequestOutputSchema from "./network/request";
import trpcPostOutputSchema from "./post/post";
import trpcReccomendationsOutputSchema from "./network/recommendations";

export const output = {
  profile: trpcProfileOutputSchema,
  follow: trpcFollowOutputSchema,
  friend: trpcFriendOutputSchema,
  post: trpcPostOutputSchema,
  block: trpcBlockOutputSchema,
  request: trpcRequestOutputSchema,
  recommendations: trpcReccomendationsOutputSchema,
};
