import * as sharedMediaSchema from "./src/shared/media";
import * as sharedUserSchema from "./src/shared/user";

import { input } from "./src/trpc";
import { output } from "./src/trpc";


const trpcValidators = {
  input,
  output
};

const sharedValidators = {
  user: sharedUserSchema,
  media: sharedMediaSchema,
};

export { trpcValidators, sharedValidators };
