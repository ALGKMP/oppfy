import { z } from "zod";

const trpcReccomendationsOutputSchema = {
  recommededProfiles: z.array(
    z.object({
      profilePictureUrl: z.string(),
      userId: z.string(),
      username: z.string(),
      profileId: z.number(),
      privacy: z.enum(["public", "private"]),
      fullName: z.string().nullable(),
    }),
  ),
};

export default trpcReccomendationsOutputSchema;
