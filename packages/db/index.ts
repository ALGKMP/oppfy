import { S3Client } from "@aws-sdk/client-s3";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { faker } from "@faker-js/faker";
import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForS3 = globalThis as { s3?: S3Client };
const globalForPrisma = globalThis as { prisma?: PrismaClient };
const globalForOpenSearch = globalThis as { openSearch?: OpenSearchClient };

// ! use for testing purposes
const testingInit = async () => {
  for (let i = 0; i < 99999; i++) {
    await prisma.user.create({
      data: {
        id: faker.string.uuid(),
        username: faker.internet.userName(),
        firstName: faker.person.firstName(),
        dateOfBirth: faker.date.past(),
      },
    });
  }
};

export const s3 =
  globalForS3.s3 ??
  new S3Client({
    region: process.env.AWS_REGION!,
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
        // ? ["query", "error", "warn"]
        ? ["error"]
        : ["error"],
  });

export const openSearch = new OpenSearchClient({
  ...AwsSigv4Signer({
    region: process.env.AWS_REGION!,
    service: "es",
    getCredentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  node: process.env.OPENSEARCH_URL!,
});

testingInit();

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3;
  globalForPrisma.prisma = prisma;
  globalForOpenSearch.openSearch = openSearch;
}