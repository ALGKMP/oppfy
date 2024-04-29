import { z } from "zod";

import { dateOfBirth, name, userId, username } from "../utils";

const userSchemas = {
  userId,
  updateName: z.object({
    name,
  }),
  updateUsername: z.object({
    username,
  }),
  updateDateOfBirth: z.object({
    dateOfBirth,
  }),
  userComplete: z.object({
    userId,
  }),
};

export default userSchemas;
