import Mux from "@mux/mux-node";

export const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!, // This is the default and can be omitted
  tokenSecret: process.env.MUX_TOKEN_SECRET!, // This is the default and can be omitted
});
