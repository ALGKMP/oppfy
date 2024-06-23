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

    console.log("Querying for recommendations for user", userId);

    // tier 1 reccs, all outgoing people within 1 edge
    const tier1 = await g.V(userId).out().id().toList();

    // tier 2 reccs, all incoming people within 1 edge
    const allTier2 = await g.V(userId).in_().id().toList();

    // Manually filtering out tier1 IDs from allTier2 using JavaScript array methods
    const tier2 = allTier2.filter((id) => !tier1.includes(id));

    const recommendedIds = {
      tier1,
      tier2,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(recommendedIds),
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
