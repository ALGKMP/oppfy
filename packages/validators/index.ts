import * as sharedMediaSchema from "./src/shared/media";
import * as sharedUserSchema from "./src/shared/user";
import { input, output } from "./src/trpc";

export { post } from "./src/trpc/output/post/post";
export {
  PublicFollowState,
  PrivateFollowState,
  FriendState,
  PrivacyStatus,
} from "./src/trpc/output/profile/profile";

export { reportProfileOptions } from "./src/trpc/input/network/report";
export { reportPostOptions } from "./src/trpc/input/network/report";

const trpcValidators = {
  input,
  output,
};

const sharedValidators = {
  user: sharedUserSchema,
  media: sharedMediaSchema,
};

export { trpcValidators, sharedValidators };
