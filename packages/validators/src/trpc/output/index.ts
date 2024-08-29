import trpcFollowOutputSchema from "./network/follow";
import trpcBlockOutputSchema from "./network/block";
import trpcRequestOutputSchema from "./network/request";
import trpcPostOutputSchema from "./post/post";

export const output = {
  follow: trpcFollowOutputSchema,
  post: trpcPostOutputSchema,
  block: trpcBlockOutputSchema,
  request: trpcRequestOutputSchema,
};
