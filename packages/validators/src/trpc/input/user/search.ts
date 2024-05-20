import { z } from "zod";

import { username } from "../../../shared/user";

const trpcSearchInputSchema = {
  profilesByUsername: z.object({
    username,
  }),
};

export default trpcSearchInputSchema;
