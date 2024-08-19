import trpcPostInputSchema from "./media/post";
import trpcRequestInputSchema from "./network/request";

export const input = {
  post: trpcPostInputSchema,
  request: trpcRequestInputSchema,
};
