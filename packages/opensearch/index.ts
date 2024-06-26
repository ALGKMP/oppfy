import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";

import { env } from "@oppfy/env/server";

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
