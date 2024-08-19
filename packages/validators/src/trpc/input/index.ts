import trpcPostInputSchema from "./media/post";
import trpcBlockInputSchema from "./network/block";
import trpcFollowInputSchema from "./network/follow";
import trpcFriendInputSchema from "./network/friend";
import trpcRequestInputSchema from "./network/request";
import trpcProfileInputSchema from "./profile/profile";

export const input = {
  post: trpcPostInputSchema,
  profile: trpcProfileInputSchema,
  block: trpcBlockInputSchema,
  follow: trpcFollowInputSchema,
  friend: trpcFriendInputSchema,
  request: trpcRequestInputSchema,
};
