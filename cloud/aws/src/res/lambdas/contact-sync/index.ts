import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import { APIGatewayProxyResult, Context } from "aws-lambda";
import gremlin from "gremlin";
import { z } from "zod";

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;
const { t, P } = gremlin.process;
const { onCreate, onMatch } = gremlin.process.merge;
const __ = gremlin.process.statics;

const NEPTUNE_ENDPOINT = process.env.NEPTUNE_ENDPOINT;
const NEPTUNE_PORT = process.env.NEPTUNE_PORT || 8182;

const contactSyncBody = z.object({
  userId: z.string(),
  userPhoneNumberHash: z.string(),
  contacts: z.array(z.string()),
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
): Promise<boolean> {
  const currentTimestamp = Date.now().toString();

  // Add or update the user vertex
  let userResult = await g
    .mergeV(
      new Map([
        [t.id, userId],
        [t.label, "User"],
      ]),
    )
    .option(
      onCreate,
      new Map([
        ["createdAt", currentTimestamp],
        ["phoneNumberHash", userPhoneNumberHash],
      ]),
    )
    .option(
      onMatch,
      new Map([
        ["phoneNumberHash", userPhoneNumberHash],
        ["updatedAt", currentTimestamp],
      ]),
    )
    .next();

  // Extract user vertex from the result and assert type
  const user = userResult.value as Vertex;

  // Get current contacts
  const currentContacts = (await g
    .V(user.id)
    .outE("contacts")
    .id()
    .toList()) as string[];

  // Create a set of new contact edge IDs
  const newContactEdgeIds = new Set<string>();

  // Add or update edges for current contacts
  for (const contactPhoneNumberHash of contacts) {
    const contactUserResult = await g
      .V()
      .hasLabel("User")
      .has("phoneNumberHash", contactPhoneNumberHash)
      .next();

    if (contactUserResult.value) {
      const contactUser = contactUserResult.value as Vertex;
      const edgeId = `${userId}_${contactUser.id}`;
      newContactEdgeIds.add(edgeId);

      await g
        .mergeE(
          new Map([
            [t.label, "contact"],
            [t.id, edgeId],
          ]),
        )
        .from_(userId)
        .to(contactUser.id)
        .property(t.id, edgeId)
        .option(onCreate, new Map([["createdAt", currentTimestamp]]))
        .option(onMatch, new Map([["updatedAt", currentTimestamp]]))
        .next();
    }
  }

  // Remove contacts that are no longer in the list
  const contactsToRemove = currentContacts.filter(
    (edgeId) => !newContactEdgeIds.has(edgeId),
  );
  if (contactsToRemove.length > 0) {
    await g.E(contactsToRemove).drop().iterate();
  }

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

    const { userId, userPhoneNumberHash, contacts } = event[0];
    console.log("userId", userId);
    console.log("userPhoneNumberHash", userPhoneNumberHash);
    console.log("contacts", contacts);

    await updateContacts(g, userId, userPhoneNumberHash, contacts);

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
