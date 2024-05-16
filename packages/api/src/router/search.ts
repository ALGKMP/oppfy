import type { ApiResponse } from "@opensearch-project/opensearch"; // Import ApiResponse type
import { z } from "zod";

import { openSearch } from "@acme/opensearch"; // Import your OpenSearch client

import { createTRPCRouter, protectedProcedure } from "../trpc"; // Import TRPC utilities

// Define the OpenSearch document structure interface
interface OpenSearchProfile {
  id: number;
  username: string;
  fullName: string;
  dateOfBirth: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

// Define the OpenSearch response structure
interface OpenSearchResponse {
  hits: {
    total: {
      value: number;
    };
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: OpenSearchProfile;
    }[];
  };
}

// Create the search router with a protected procedure for searching users by username
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
        // Perform the search query using the OpenSearch client
        const response: ApiResponse<OpenSearchResponse> =
          await openSearch.search({
            index: "profile",
            body: {
              query: {
                wildcard: {
                  username: `*${username}*`,
                },
              },
              size: 25, // Limit the results to 25 documents
            },
          });

        // Extract the hits from the response and map to get the _source property
        const hits = response.body.hits.hits.map((hit) => hit._source);
        console.log("Search response:", hits);

        // Return the hits as the result
        return hits;
      } catch (error) {
        console.error("Search error:", error);
        throw new Error("Failed to search for users");
      }
    }),
});
