import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3/dist-types/commands";

import type {
  OpenSearchProfileIndexResult,
  OpenSearchResponse,
} from "@oppfy/opensearch";
import { openSearch, OpenSearchIndex } from "@oppfy/opensearch";

import { handleOpensearchErrors } from "../../errors";

export type { GetObjectCommandInput, PutObjectCommandInput };

export class SearchRepository {
  private openSearch = openSearch;

  @handleOpensearchErrors
  async profilesByUsername(
    username: string,
    currentProfileId: number,
    limit = 15,
  ) {
    const response = await this.openSearch.search<
      OpenSearchResponse<OpenSearchProfileIndexResult>
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

  @handleOpensearchErrors
  async upsertProfile(
    profileId: number,
    profileData: Partial<OpenSearchProfileIndexResult>,
  ) {
    // Search for existing document
    const searchResult = await this.openSearch.search<
      OpenSearchResponse<OpenSearchProfileIndexResult>
    >({
      index: OpenSearchIndex.PROFILE,
      body: {
        query: {
          term: { id: profileId },
        },
      },
    });

    if (searchResult.body.hits.hits.length > 0) {
      // Update existing document
      const documentId = searchResult.body.hits.hits[0]?._id;

      if (documentId === undefined) {
        throw new Error("Document ID was not found");
      }

      await this.openSearch.update({
        index: OpenSearchIndex.PROFILE,
        id: documentId,
        body: {
          doc: {
            ...profileData,
            id: profileId, // Ensure the id is always included
          },
        },
      });
    } else {
      // Insert new document
      await this.openSearch.index({
        index: OpenSearchIndex.PROFILE,
        body: {
          ...profileData,
          id: profileId, // Ensure the id is always included
        },
      });
    }

    // Return the updated/inserted data
    return {
      id: profileId,
      ...profileData,
    };
  }

  @handleOpensearchErrors
  async deleteProfile(profileId: number) {
    // Search for the document in OpenSearch
    const searchResult = await this.openSearch.search<
      OpenSearchResponse<OpenSearchProfileIndexResult>
    >({
      index: OpenSearchIndex.PROFILE,
      body: {
        query: {
          term: { id: profileId },
        },
      },
    });

    // If a matching document is found, delete it
    if (searchResult.body.hits.hits.length > 0) {
      const documentId = searchResult.body.hits.hits[0]?._id;

      if (documentId === undefined) {
        throw new Error("Document ID was not found");
      }

      await this.openSearch.delete({
        index: OpenSearchIndex.PROFILE,
        id: documentId,
      });
    }
  }
}
