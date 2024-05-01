import * as sharedMediaSchema from "./src/shared/shared.media.schema";
import * as sharedUserSchema from "./src/shared/shared.user.schema";
import authSchemas from "./src/trpc/trpc.auth.schema";
import postSchemas from "./src/trpc/trpc.post.schema";
import profileSchemas from "./src/trpc/trpc.profile.schema";
import userSchemas from "./src/trpc/trpc.user.schema";

const trpcValidators = {
  user: userSchemas,
  auth: authSchemas,
  profile: profileSchemas,
  post: postSchemas,
};

const sharedValidators = {
  user: sharedUserSchema,
  media: sharedMediaSchema,
};

export { trpcValidators, sharedValidators };
