import { z } from "zod";

const trpcUserInputSchemas = {
  createUser: z.object({
    userId: z.string(),
    phoneNumber: z.string(),
  }),
  getUser: z.object({
    userId: z.string(),
  }),
  updateUser: z.object({
    userId: z.string(),
    username: z
      .string()
      .min(1, { message: "Username is too short" })
      .max(20, { message: "Username is too long" }),
  }),
  updatePrivacySetting: z.object({
    privacy: z.enum(["public", "private"]),
  }),
};

export default trpcUserInputSchemas;
