import { NextApiRequest, NextApiResponse } from "next";
import cors from "nextjs-cors";
import { createOpenApiNextHandler } from "trpc-openapi";

import { appRouter, createTRPCContext } from "@acme/api";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Setup CORS
  await cors(req, res);

  // Handle incoming OpenAPI requests
  return createOpenApiNextHandler({
    router: appRouter,
    createContext: createTRPCContext,
    onError() {
      console.error("Error in TRPC handler");
    },
    responseMeta() {
      return {
        headers: {
          "x-powered-by": "trpc",
        },
      };
    },
  })(req, res);
};

export default handler;
