import { z } from "zod";

const trpcContactsInputSchema = {
  syncContacts: z.array(z.string()),

  getRecommendationProfilesOther: z.object({
    profileId: z.number(),
  }),
};

export default trpcContactsInputSchema;
