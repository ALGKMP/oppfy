import { z } from "zod";

import { dateOfBirth, fullName, userId, username } from "../utils";

const userSchemas = {
  userId,
  updateName: z.object({
    fullName,
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
