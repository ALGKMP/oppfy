import { z } from "zod";

const trpcContactsInputSchema = {
  syncContacts: z.array(z.string()),
};

export default trpcContactsInputSchema;
