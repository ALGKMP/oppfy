import type {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3/dist-types/commands";

import { db, eq, schema } from "@oppfy/db";
import type {
  OpenSearchProfileIndexResult,
  OpenSearchResponse,
} from "@oppfy/opensearch";
import { openSearch, OpenSearchIndex } from "@oppfy/opensearch";

import { handleOpensearchErrors } from "../../errors";

export type { GetObjectCommandInput, PutObjectCommandInput };

export class SearchRepository {
  private db = db;
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
        size: limit,
      },
    });

    return response.body.hits.hits.map((hit) => hit._source);
  }

  @handleOpensearchErrors
  async upsertProfile(
    profileId: number,
    newProfileData: Partial<OpenSearchProfileIndexResult>,
  ) {
    const profile = await this.db.query.profile.findFirst({
      where: eq(schema.profile.id, profileId),
      columns: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        dateOfBirth: true,
        profilePictureKey: true,
      },
    });

    if (profile === undefined) {
      throw new Error("Profile not found");
    }

    const documentBody = {
      ...profile,
      ...newProfileData,
    };

    await this.openSearch.index({
      index: OpenSearchIndex.PROFILE,
      id: profileId.toString(),
      body: documentBody,
    });
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
