import type { NextApiRequest, NextApiResponse } from "next";

import { openApiDocument } from "@oppfy/api";

// Respond with our OpenAPI schema
const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  return process.env.NODE_ENV === "development"
    ? res.status(200).send(openApiDocument)
    : res.status(404).send("Not Found");
};

export default handler;
