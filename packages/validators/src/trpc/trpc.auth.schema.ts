import { z } from "zod";

import { userId, username } from "../shared/shared.user.schema";

const trpcAuthSchema = {
  createUser: z.object({
    userId,
  }),
  getUser: z.object({
    userId,
  }),
  deleteUser: z.object({
    userId,
  }),
  updateUser: z.object({
    userId,
    username,
  }),
};

export default trpcAuthSchema;
