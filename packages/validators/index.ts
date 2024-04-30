import * as sharedUserSchema from "./src/shared/shared.user.schema";
import trpcAuthSchema from "./src/trpc/trpc.auth.schema";
import trpcPostSchema from "./src/trpc/trpc.post.schema";
import trpcProfileSchema from "./src/trpc/trpc.profile.schema";
import trpcUserSchema from "./src/trpc/trpc.user.schema";

const trpcValidators = {
  user: trpcUserSchema,
  auth: trpcAuthSchema,
  profile: trpcProfileSchema,
  post: trpcPostSchema,
};

const sharedSchemas = {
  user: sharedUserSchema,
};

export { trpcValidators, sharedSchemas };
