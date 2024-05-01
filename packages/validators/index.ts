import * as sharedMediaSchema from "./src/shared/media";
import * as sharedUserSchema from "./src/shared/user";

import trpcAuthSchema from "./src/trpc/auth";
import trpcPostSchema from "./src/trpc/post";
import trpcProfileSchema from "./src/trpc/profile";
import trpcUserSchema from "./src/trpc/user";

const trpcValidators = {
  user: trpcUserSchema,
  auth: trpcAuthSchema,
  profile: trpcProfileSchema,
  post: trpcPostSchema,
};

const sharedValidators = {
  user: sharedUserSchema,
  media: sharedMediaSchema,
};

export { trpcValidators, sharedValidators };
