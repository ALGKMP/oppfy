import { z } from "zod";

import {
  dateOfBirth,
  fullName,
  userId,
  username,
} from "../shared/user";

const trpcUserSchema = {
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

export default trpcUserSchema;
