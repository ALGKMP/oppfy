import trpcPostInputSchema from "./media/post";
import trpcBlockInputSchema from "./network/block";
import trpcFollowInputSchema from "./network/follow";
import trpcFriendInputSchema from "./network/friend";
import trpcRequestInputSchema from "./network/request";

export const input = {
  post: trpcPostInputSchema,
  block: trpcBlockInputSchema,
  follow: trpcFollowInputSchema,
  friend: trpcFriendInputSchema,
  request: trpcRequestInputSchema,
};
