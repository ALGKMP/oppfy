import { z } from "zod";

import { username } from "../../../shared";

const trpcSearchInputSchema = {
  profilesByUsername: z.object({
    username,
  }),
};

export default trpcSearchInputSchema;
