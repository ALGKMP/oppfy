import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3/dist-types/commands";
import type { ApiResponse } from "@opensearch-project/opensearch";

import { InferInsertModel, schema } from "@oppfy/db";
import { openSearch } from "@oppfy/opensearch";

import { handleOpensearchErrors } from "../../errors";

export type { GetObjectCommandInput, PutObjectCommandInput };

enum OpenSearchIndex {
  PROFILE = "profile",
}

interface OpenSearchResult {
  id: number;
  username: string;
  fullName: string;
  bio: string;
  profilePictureKey: string;
}

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
  async profilesByUsername(
    username: string,
    currentProfileId: number,
    limit = 15,
  ) {
    const response = await this.openSearch.search<
      OpenSearchResponse<OpenSearchResult>
    >({
      index: OpenSearchIndex.PROFILE,
      body: {
        query: {
          bool: {
            must: {
              wildcard: {
                username: `*${username}*`,
              },
            },
            must_not: {
              term: {
                id: currentProfileId,
              },
            },
          },
        },
        _source: ["id", "username", "fullName", "bio", "profilePictureKey"],
        size: limit,
      },
    });

    return response.body.hits.hits.map((hit) => hit._source);
  }
}
