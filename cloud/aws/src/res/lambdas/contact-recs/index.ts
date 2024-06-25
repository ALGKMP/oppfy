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
    const userId = event.queryStringParameters?.userId!;

    console.log("Querying for recommendations for user", userId);

    const tier1 = await g
      .V(userId)
      .outE("contact")
      .has("isFollowing", false)
      .inV()
      .dedup()
      .limit(10)
      .toList();

    console.log(tier1);

    // all incoming people
    const tier2 = await g.V(userId).inE("contact").outV().toList();

    // remove all tier1 from tier2
    tier2.filter((v) => !tier1.includes(v));

    // get tier 3
    const tier3 = g
      .V(userId) // Start from the user vertex
      .out("contact") // Traverse to all contacts of the user
      .aggregate("contacts") // Store all contacts in a side-effect named 'contacts'
      .out("contact") // Traverse to contacts of contacts
      .where(__.not(__.inE("contact").from_(userId))) // Filter out vertices that are already contacts of the user
      .groupCount() // Count occurrences of each vertex
      .unfold() // Unroll the map into individual entries
      .where(__.values().is(P.gte(3))) // Keep only entries with count >= 3
      .limit(10) // Limit to 10 results
      .toList(); // Execute the traversal

    const recommendedIds = {
      tier1,
      tier2,
      tier3,
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
