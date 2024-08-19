import trpcPostInputSchema from "./media/post";
import trpcBlockInputSchema from "./network/block";
import trpcFollowInputSchema from "./network/follow";
import trpcFriendInputSchema from "./network/friend";
import trpcReportInputSchema from "./network/report";
import trpcRequestInputSchema from "./network/request";
import trpcProfileInputSchema from "./profile/profile";
import trpcContactsInputSchema from "./user/contacts";
import trpcNotificationsInputSchema from "./user/notifications";

export const input = {
  post: trpcPostInputSchema,
  profile: trpcProfileInputSchema,
  block: trpcBlockInputSchema,
  follow: trpcFollowInputSchema,
  friend: trpcFriendInputSchema,
  notifications: trpcNotificationsInputSchema,
  contacts: trpcContactsInputSchema,
  report: trpcReportInputSchema,
  request: trpcRequestInputSchema,
};
