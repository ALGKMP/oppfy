import { SqsEnvelope } from "@aws-lambda-powertools/parser/envelopes";
import { parser } from "@aws-lambda-powertools/parser/middleware";
import middy from "@middy/core";
import { APIGatewayProxyResult, Context } from "aws-lambda";
import gremlin from "gremlin";
import { z } from "zod";

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;
const t = gremlin.process.t;
const Direction = gremlin.process.direction;
const { onCreate, onMatch } = gremlin.process.merge;

const NEPTUNE_ENDPOINT = process.env.NEPTUNE_ENDPOINT;
const NEPTUNE_PORT = process.env.NEPTUNE_PORT || 8182;

const contactSyncBody = z.object({
  userId: z.string(),
  userPhoneNumberHash: z.string(),
  contacts: z.array(z.string()),
});

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

    // Check if user vertex exists and create or update accordingly
    let userVertex = await g.V().has("User", "userId", userId).next();
    if (!userVertex.value) {
      // Create user vertex
      userVertex = await g
        .addV("User")
        .property("userId", userId)
        .property("userPhoneNumberHash", userPhoneNumberHash)
        .next();
    } else {
      // Update user vertex
      await g
        .V(userVertex.value.id)
        .property("userPhoneNumberHash", userPhoneNumberHash)
        .next();
    }

    // Fetch existing contacts
    const existingContacts = await g
      .V(userVertex.value.id)
      .out("hasContact")
      .values("phoneHash")
      .toList();

    // Add new contacts and remove old ones
    const contactSet = new Set(contacts);
    const existingContactSet = new Set(existingContacts);

    // Add new contacts
    for (const contact of contacts) {
      if (!existingContactSet.has(contact)) {
        const contactVertex = await g
          .addV("Contact")
          .property("phoneHash", contact)
          .next();
        await g
          .V(userVertex.value.id)
          .addE("hasContact")
          .to(contactVertex)
          .next();
      }
    }

    console.log("did some shit");

    // Remove old contacts
    /*    for (const existingContact of existingContacts) {
      if (!contactSet.has(existingContact)) {
        const contactVertices = await g.V().has('Contact', 'phoneHash', existingContact).toList();
        for (const contactVertex of contactVertices) {
          await g.V(userVertex.value.id).outE('hasContact').where(gremlin.process.statics.inV().is(contactVertex)).drop().iterate();
        }
      }
    } */

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
