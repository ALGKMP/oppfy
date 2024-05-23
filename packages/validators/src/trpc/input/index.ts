import trpcPostInputSchema from "./media/post";
import trpcBlockInputSchema from "./network/block";
import trpcFollowInputSchema from "./network/follow";
import trpcFriendInputSchema from "./network/friend";
import trpcProfileInputSchema from "./profile/profile";
import trpcNotificationsInputSchema from "./user/notifications";
import trpcSearchInputSchema from "./user/search";
import trpcUserInputSchema from "./user/user";
import trpcReportInputSchema from "./network/report";

export const input = {
  user: trpcUserInputSchema,
  post: trpcPostInputSchema,
  profile: trpcProfileInputSchema,
  search: trpcSearchInputSchema,
  block: trpcBlockInputSchema,
  follow: trpcFollowInputSchema,
  friend: trpcFriendInputSchema,
  notifications: trpcNotificationsInputSchema,
  report: trpcReportInputSchema,
};
