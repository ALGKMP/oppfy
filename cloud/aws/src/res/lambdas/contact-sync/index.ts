import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import { createEnv } from "@t3-oss/env-core";
import { APIGatewayProxyResult, Context } from "aws-lambda";
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
  followingIds: z.array(z.string()),
});

interface Vertex {
  id: string;
  label: string;
  properties: Record<string, any>;
}

async function updateContacts(
  g: gremlin.process.GraphTraversalSource,
  userId: string,
  userPhoneNumberHash: string,
  contacts: string[],
  followingIds: string[],
): Promise<boolean> {
  const currentTimestamp = Date.now().toString();

  // Add or update the user vertex
  let userResult = await g
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
    .property(
      "isFollowing",
      __.choose(
        __.select("contactUser").id().is(P.within(followingIds)),
        __.constant(true),
        __.constant(false),
      ),
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
  console.log("Lambda invoked");

  let dc: any;
  let g: gremlin.process.GraphTraversalSource;

  try {
    const graph = new Graph();
    dc = new DriverRemoteConnection(`wss://${env.NEPTUNE_ENDPOINT}/gremlin`, {});
    g = graph.traversal().withRemote(dc);

    console.log(event[0]);

    const { userId, userPhoneNumberHash, contacts, followingIds } = event[0];

    await updateContacts(
      g,
      userId,
      userPhoneNumberHash,
      contacts,
      followingIds,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
      }),
    };
  } catch (error) {
    console.error("Error during execution", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  } finally {
    if (dc) {
      dc.close();
      console.log("Remote connection closed");
    }
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: contactSyncBody, envelope: SqsEnvelope }),
);
