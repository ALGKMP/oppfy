import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyResult, Context } from "aws-lambda";
import gremlin from "gremlin";
import { z } from "zod";

const env = createEnv({
  server: {
    NEPTUNE_ENDPOINT: z.string().min(1),
  },
  runtimeEnv: process.env,
});

const {
  driver: { DriverRemoteConnection },
  structure: { Graph },
  process: {
    t,
    P,
    merge: { onCreate, onMatch },
    statics: __,
  },
} = gremlin;

const contactSyncBody = z.object({
  userId: z.string(),
  userPhoneNumberHash: z.string(),
  contacts: z.array(z.string()),
});

interface Vertex {
  id: string;
  label: string;
  properties: Record<string, unknown>;
}

async function updateContacts(
  g: gremlin.process.GraphTraversalSource,
  userId: string,
  userPhoneNumberHash: string,
  contacts: string[],
): Promise<boolean> {
  const currentTimestamp = Date.now().toString();

  // Add or update the user vertex
  const userResult = await g
    .mergeV(
      new Map([
        [t.id, userId],
        [t.label, userId],
      ]),
    )
    .option(
      onCreate,
      new Map([
        ["createdAt", currentTimestamp],
        ["phoneNumberHash", userPhoneNumberHash],
      ]),
    )
    .option(onMatch, new Map([["updatedAt", currentTimestamp]]))
    .next();

  // Extract user vertex from the result and assert type
  const user = userResult.value as Vertex;

  // Create or update contact edges
  await g
    .V(user.id)
    .as("currentUser")
    .V()
    .has("phoneNumberHash", P.within(contacts))
    .where(P.neq("currentUser"))
    .as("contactUser")
    .coalesce(
      __.inE("contact").where(__.outV().hasId(userId)),
      __.addE("contact")
        .from_("currentUser")
        .property("createdAt", currentTimestamp),
    )
    .iterate();

  return true;
}

// list bc of middy powertools thing
// 1. Parses data using SqsSchema.
// 2. Parses records in body key using your schema and return them in a list.
type ContactSyncBodyType = z.infer<typeof contactSyncBody>[];

const lambdaHandler = async (
  event: ContactSyncBodyType,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    // check body first
    if (!event[0]) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Malformed request",
        }),
      };
    }

    const graph = new Graph();
    const dc = new DriverRemoteConnection(
      `wss://${env.NEPTUNE_ENDPOINT}/gremlin`,
      {},
    );
    const g = graph.traversal().withRemote(dc);

    const { userId, userPhoneNumberHash, contacts } = event[0];

    await updateContacts(
      g,
      userId,
      userPhoneNumberHash,
      contacts,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: contactSyncBody, envelope: SqsEnvelope }),
);
