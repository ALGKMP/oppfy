import { z } from "zod";

import { userId, username } from "../utils";

const authSchemas = {
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

export default authSchemas;
