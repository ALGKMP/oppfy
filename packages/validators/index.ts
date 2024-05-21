import * as sharedUserSchema from "./src/shared/user";
import { input, output } from "./src/trpc";

export  { PublicFollowState, PrivateFollowState, FriendState, PrivacyStatus } from "./src/trpc/output/profile/profile";

const trpcValidators = {
  input,
  output,
};

const sharedValidators = {
  user: sharedUserSchema,
};

export { trpcValidators, sharedValidators };
