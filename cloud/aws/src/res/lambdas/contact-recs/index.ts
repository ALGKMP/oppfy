import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import gremlin from "gremlin";

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

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const graph = new Graph();
    const dc = new DriverRemoteConnection(
      `wss://${NEPTUNE_ENDPOINT}/gremlin`,
      {},
    );
    const g = graph.traversal().withRemote(dc);
    const userId = event.pathParameters?.userId!;

    const reccomendedIds = [];

    // tier 1 reccs, all outgoing people within 1 edge
    const tier1 = await g.V(userId).out().id().toList();

    // tier 2 reccs, all incoming people within 1 edge not in tier 1
    const tier2 = await g.V(userId).in_().id().where(P.without(tier1)).toList();

    reccomendedIds.push({
      tier1,
      tier2,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(reccomendedIds),
    };
  } catch (error) {
    console.error("Error during execution", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
};
