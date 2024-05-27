import * as sharedUserSchema from "./src/shared/user";
import { input, output } from "./src/trpc";

export  { PublicFollowState, PrivateFollowState, FriendState, PrivacyStatus } from "./src/trpc/output/profile/profile";
export { reportProfileOptions } from "./src/trpc/input/network/report";
export { reportPostOptions } from "./src/trpc/input/network/report";
export { post } from "./src/trpc/output/post/post";

const trpcValidators = {
  input,
  output,
};

const sharedValidators = {
  user: sharedUserSchema,
};

export { trpcValidators, sharedValidators };
