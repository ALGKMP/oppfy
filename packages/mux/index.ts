import Mux from "@mux/mux-node";

import { env } from "@oppfy/env";
env.

export const mux = new Mux({
  tokenId: env.MUX_TOKEN_ID,
  tokenSecret: env.MUX_TOKEN_SECRET,
});

process.env.