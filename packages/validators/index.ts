import * as sharedAwsSchema from "./src/shared/aws";
import * as sharedMediaSchema from "./src/shared/media";
import * as sharedNotificationsSchema from "./src/shared/notifications";
import * as sharedReportSchema from "./src/shared/report";
import * as sharedUserSchema from "./src/shared/user";

const sharedValidators = {
  user: sharedUserSchema,
  media: sharedMediaSchema,
  notifications: sharedNotificationsSchema,
  report: sharedReportSchema,
  aws: sharedAwsSchema,
};

export { sharedValidators };
