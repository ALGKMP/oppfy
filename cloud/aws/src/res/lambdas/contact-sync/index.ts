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

  console.log(event[0].userId);
  let dc: any;
  let g: gremlin.process.GraphTraversalSource;

  console.log("Connecting to Neptune", NEPTUNE_ENDPOINT, NEPTUNE_PORT);

  try {
    const graph = new Graph();
    g = graph
      .traversal()
      .withRemote(
        new DriverRemoteConnection(`wss://${NEPTUNE_ENDPOINT}/gremlin`, {}),
      );

    const res = await g.mergeV(
      new Map([[t.id, event[0].userId]]),
    ).option(onCreate, new Map([["created", Date.now()]]))
      .option(onMatch, new Map([["updated", Date.now()]])).elementMap()
      .toList();

      console.log(res);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "hi",
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
