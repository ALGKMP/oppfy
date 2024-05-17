import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3/dist-types/commands";
import type { ApiResponse } from "@opensearch-project/opensearch"; // Import ApiResponse type

import { openSearch } from "@oppfy/opensearch";

import { handleOpensearchErrors } from "../errors";

export type { GetObjectCommandInput, PutObjectCommandInput };

interface OpenSearchProfile {
  id: number;
  username: string;
  fullName: string;
  dateOfBirth: string;
  profilePictureKey: string;
  createdAt: string;
  updatedAt: string;
}

// Define the OpenSearch response structure
interface OpenSearchResponse<T> {
  hits: {
    total: {
      value: number;
    };
    hits: {
      _index: string;
      _type: string;
      _id: string;
      _score: number;
      _source: T;
    }[];
  };
}

export class SearchRepository {
  private openSearch = openSearch;

  @handleOpensearchErrors
  async profilesByUsername(username: string, limit = 15) {
    const response = (await this.openSearch.search({
      index: "profile",
      body: {
        query: {
          wildcard: {
            username: `*${username}*`,
          },
        },
        size: limit,
      },
    })) satisfies ApiResponse<OpenSearchResponse<OpenSearchProfile>>;

    return response.body.hits.hits.map((hit) => hit._source);
  }
}
