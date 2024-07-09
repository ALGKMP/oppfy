import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

import { env } from "@oppfy/env";

export enum OpenSearchIndex {
  PROFILE = "profile",
}

export interface OpenSearchProfileIndexResult {
  id: number;
  username: string;
  fullName: string;
  bio: string;
  profilePictureKey: string;
}

export interface OpenSearchResponse<T> {
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

export const openSearch = new OpenSearchClient({
  ...AwsSigv4Signer({
    region: env.AWS_REGION,
    service: "es",
    getCredentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  node: env.OPENSEARCH_URL,
});
