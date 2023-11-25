import type { NextApiRequest, NextApiResponse } from "next";

import { openApiDocument } from "@acme/api";

// Respond with our OpenAPI schema
const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).send("Not Found");
  }

  res.status(200).send(openApiDocument);
};

export default handler;
