import * as sharedAwsSchema from "./src/shared/aws";
import * as sharedMediaSchema from "./src/shared/media";
import * as sharedNotificationsSchema from "./src/shared/notifications";
import * as sharedReportSchema from "./src/shared/report";
import * as sharedUserSchema from "./src/shared/user";
import { input, output } from "./src/trpc";

export {
  PublicFollowState,
  PrivateFollowState,
  FriendState,
  PrivacyStatus,
} from "./src/trpc/output/profile/profile";

const trpcValidators = {
  input,
  output,
};

const sharedValidators = {
  user: sharedUserSchema,
  media: sharedMediaSchema,
  notifications: sharedNotificationsSchema,
  report: sharedReportSchema,
  aws: sharedAwsSchema,
};

export { trpcValidators, sharedValidators };
