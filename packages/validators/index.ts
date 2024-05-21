import * as sharedUserSchema from "./src/shared/user";
import { input, output } from "./src/trpc";

const trpcValidators = {
  input,
  output,
};

const sharedValidators = {
  user: sharedUserSchema,
};

export { trpcValidators, sharedValidators };
