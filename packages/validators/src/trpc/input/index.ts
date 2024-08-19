import trpcPostInputSchema from "./media/post";
import trpcBlockInputSchema from "./network/block";
import trpcFollowInputSchema from "./network/follow";
import trpcFriendInputSchema from "./network/friend";
import trpcRequestInputSchema from "./network/request";
import trpcProfileInputSchema from "./profile/profile";
import trpcContactsInputSchema from "./user/contacts";

export const input = {
  post: trpcPostInputSchema,
  profile: trpcProfileInputSchema,
  block: trpcBlockInputSchema,
  follow: trpcFollowInputSchema,
  friend: trpcFriendInputSchema,
  contacts: trpcContactsInputSchema,
  request: trpcRequestInputSchema,
};
