import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import { APIGatewayProxyResult, Context } from "aws-lambda";
import gremlin from "gremlin";
import { z } from "zod";

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

const NEPTUNE_ENDPOINT = process.env.NEPTUNE_ENDPOINT;
const NEPTUNE_PORT = process.env.NEPTUNE_PORT || 8182;

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
  followingIds: Set<string>,
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
        __.select("contactUser")
          .id()
          .is(P.within(Array.from(followingIds))),
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

  console.log("Connecting to Neptune", NEPTUNE_ENDPOINT, NEPTUNE_PORT);

  try {
    const graph = new Graph();
    dc = new DriverRemoteConnection(`wss://${NEPTUNE_ENDPOINT}/gremlin`, {});
    g = graph.traversal().withRemote(dc);

    const { userId, userPhoneNumberHash, contacts, followingIds } = event[0];
    console.log("userId", userId);
    console.log("userPhoneNumberHash", userPhoneNumberHash);
    console.log("contacts", contacts);
    console.log("followingIds", followingIds);

    await updateContacts(
      g,
      userId,
      userPhoneNumberHash,
      contacts,
      new Set(followingIds),
    );

    console.log("Update successful");

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
