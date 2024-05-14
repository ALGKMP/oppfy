import type { ApiResponse } from "@opensearch-project/opensearch"; // Import ApiResponse type
import { z } from "zod";

import { openSearch } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

interface OpenSearchUser {
  id: string;
  username?: string; // Marked as optional because one of your records does not have a username
}

interface OpenSearchResponse {
  hits: {
    total: number;
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: OpenSearchUser;
    }[];
  };
}

export const searchRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { username } = input;

      try {
        const response: ApiResponse<OpenSearchResponse> =
          await openSearch.search({
            index: "user",
            body: {
              query: {
                wildcard: {
                  username: `*${username}*`,
                },
              },
              size: 25,
            },
          });

        const hits = response.body.hits.hits.map((hit) => hit._source);
        console.log("Search response:", hits);

        return hits;
      } catch (error) {
        console.error("Search error:", error);
        throw new Error("Failed to search for users");
      }
    }),
});
