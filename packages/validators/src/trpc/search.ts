import { z } from "zod";

import { username } from "../shared/user";

const trpcSearchSchema = {
  profilesByUsername: z.object({
    username,
  }),
};

export default trpcSearchSchema;
