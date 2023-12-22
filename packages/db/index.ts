import { S3Client } from "@aws-sdk/client-s3";
import { Client as ElasticSearchClient } from "@elastic/elasticsearch";
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForS3 = globalThis as { s3?: S3Client };
const globalForPrisma = globalThis as { prisma?: PrismaClient };
const globalForElasticSearch = globalThis as {
  elasticSearch?: ElasticSearchClient;
};

export const s3 =
  globalForS3.s3 ??
  new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

const elasticSearch = new ElasticSearchClient({
  node: "https://...", // Elasticsearch endpoint
  auth: {
    apiKey: {
      // API key ID and secret
      id: "foo",
      api_key: "bar",
    },
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3;
  globalForPrisma.prisma = prisma;
  globalForElasticSearch.elasticSearch = elasticSearch;
}
