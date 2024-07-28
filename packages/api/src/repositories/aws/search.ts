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
    currentUserId: string,
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
                _id: currentUserId,
              },
            },
          },
        },
        size: limit,
      },
    });

    return response.body.hits.hits.map((hit) => ({
      ...hit._source,
      userId: hit._id,
    }));
  }

  @handleOpensearchErrors
  async upsertProfile(
    userId: string,
    newProfileData: Partial<OpenSearchProfileIndexResult>,
  ) {
    const userWithProfile = await this.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: {
        profile: {
          columns: {
            username: true,
            fullName: true,
            bio: true,
            dateOfBirth: true,
            profilePictureKey: true,
          },
        },
      },
    });

    if (userWithProfile === undefined) {
      throw new Error("Profile not found");
    }
    const profileData = userWithProfile.profile;

    const documentBody = {
      ...profileData,
      ...newProfileData,
    };

    await this.openSearch.index({
      index: OpenSearchIndex.PROFILE,
      id: userId,
      body: documentBody,
    });
  }

  @handleOpensearchErrors
  async deleteProfile(userId: string) {
    await this.openSearch.delete({
      index: OpenSearchIndex.PROFILE,
      id: userId,
    });
  }
}
