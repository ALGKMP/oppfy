import { NextApiRequest, NextApiResponse } from "next";
import cors from "nextjs-cors";

import { appRouter, createTRPCContext } from "@oppfy/api";

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// export const runtime = "edge";

/**
 * Configure basic CORS headers
 * You should extend this to match your needs
 */
const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
};

export const OPTIONS = () => {
  const response = new Response(null, {
    status: 204,
  });
  console.log("TRPC OPTIONS Hit!");
  setCorsHeaders(response);
  console.log(`>>> TRPC OPTIONS Response: ${response}`);
  return response;
};

const handler = async (req: Request, res: Response) => {
  console.log("TRPC Route Hit!"); // Add this to verify route is being accessed
  const response = await fetchRequestHandler({ // TODO: This is not working
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response);
  return response;
};

export { handler as GET, handler as POST };
// export default handler;

// const setCorsHeaders = (res: Response) => {
//   res.headers.set("Access-Control-Allow-Origin", "*");
//   res.headers.set("Access-Control-Request-Method", "*");
//   res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
//   res.headers.set("Access-Control-Allow-Headers", "*");

//   // Add these additional headers
//   res.headers.set("Access-Control-Allow-Credentials", "true");
//   res.headers.set("Access-Control-Expose-Headers", "*");
// };

// export const OPTIONS = () => {
//   const response = new Response(null, {
//     status: 204,
//   });
//   setCorsHeaders(response);
//   return response;
// };

// const handler = async (req: NextApiRequest, res: NextApiResponse) => {
//   console.log("TRPC Route Hit!"); // Add this to verify route is being accessed
//   // Setup CORS
//   // await cors(res, req);

//   // Handle incoming OpenAPI requests
//   return fetchRequestHandler({
//     endpoint: "/api/trpc",
//     router: appRouter,
//     req,
//     createContext: createTRPCContext,
//     onError() {
//       console.error("Error in TRPC handler");
//     },
//     responseMeta() {
//       return {
//         headers: {
//           "x-powered-by": "trpc",
//         },
//       };
//     },
//   })(req, res);
// };

// export { handler as GET, handler as POST };
