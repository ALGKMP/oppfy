import { NextApiRequest, NextApiResponse } from "next";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import cors from "nextjs-cors";

import { appRouter, createTRPCContext } from "@oppfy/api";

// Handle incoming tRPC requests
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Enable cors
  await cors(req, res);

  // Let the tRPC handler do its magic
  return createNextApiHandler({
    router: appRouter,
    createContext: createTRPCContext,
    onError({ error }) {
      console.error("Error:", error);

      if (error.code === "INTERNAL_SERVER_ERROR") {
        // send to bug reporting
      }
    },
  })(req, res);
};

export default handler;
