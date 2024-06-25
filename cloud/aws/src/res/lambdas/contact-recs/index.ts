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
      .out("contact")
      .where(__.not(__.inE("contact").has("isFollowing", true).from_(userId)))
      .dedup()
      .limit(10)
      /*       .project("id", "phoneNumberHash")
      .by(__.id())
      .by("phoneNumberHash") */
      .toList();

    // Implementing the provided Gremlin query
    const tier2 = await g
      .V(userId)
      .in_("contact")
      .where(__.not(__.outE("contact").has("isFollowing", true).to(userId)))
      .where(__.out("contact").hasId(userId))
      .where(__.id().is(P.without(tier1)))
      .dedup()
      .limit(10)
      .project("id", "phoneNumberHash")
      .by(__.id())
      .by("phoneNumberHash")
      .toList();

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
