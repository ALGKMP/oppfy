import { S3Client } from "@aws-sdk/client-s3";
import { faker } from "@faker-js/faker";
import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForS3 = globalThis as { s3?: S3Client };
const globalForPrisma = globalThis as { prisma?: PrismaClient };
// const globalForOpenSearch = globalThis as { openSearch?: OpenSearchClient };

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

// const openSearch = new OpenSearchClient({
//   // connect to aws opensearch using vpc
//   node: "https://...", // Elasticsearch endpoint
// });

// for (let i = 0; i < 10; i++) {
//   await prisma.user.create({
//     data: {
//       id: faker.string.uuid(),
//       username: faker.internet.userName(),
//       firstName: faker.person.firstName(),
//       dateOfBirth: faker.date.past(),
//     },
//   });
// }

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3;
  globalForPrisma.prisma = prisma;
  // globalForOpenSearch.openSearch = openSearch;
}
