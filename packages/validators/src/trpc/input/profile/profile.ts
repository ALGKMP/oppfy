import { z } from "zod";

import { bio, dateOfBirth, fullName, username } from "../../../shared";

const trpcProfileInputSchema = {
  generatePresignedUrlForProfilePicture: z.object({
    contentLength: z.number().refine((size) => size < 5 * 1024 * 1024),
  }),

  updateProfile: z.object({
    fullName: fullName.optional(),
    username: username.optional(),
    bio: bio.optional(),
    dateOfBirth: dateOfBirth.optional(),
  }),

  updateUsername: z.object({
    username: z // Can use shared validators here
      .string()
      .min(1, { message: "Username is too short" })
      .max(20, { message: "Username is too long" }),
  }),

  updateFullName: z.object({
    fullName: z // Can use shared validators here
      .string()
      .min(3, { message: "Name is too short" })
      .max(50, { message: "Name is too long" })
      .regex(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/, {
        message: "Name contains invalid characters",
      }),
  }),

  updateDateOfBirth: z.object({
    dateOfBirth: z.date(),
  }),

  getCompactProfileOther: z.object({
    profileId: z.number(),
  }),

  getFullProfileOther: z.object({
    profileId: z.number(),
  }),
};

export default trpcProfileInputSchema;
