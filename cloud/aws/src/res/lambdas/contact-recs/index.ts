import { createEnv } from "@t3-oss/env-core";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import gremlin from "gremlin";
import { z } from "zod";

import { db, eq, schema } from "@oppfy/db";

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
    order,
    statics: __,
  },
} = gremlin;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const graph = new Graph();
    const dc = new DriverRemoteConnection(
      `wss://${env.NEPTUNE_ENDPOINT}/gremlin`,
      {},
    );
    const g = graph.traversal().withRemote(dc);
    const userId = event.queryStringParameters?.userId!;
    console.log("Querying for recommendations for user", userId);

    const following = await db
      .select({ userId: schema.follower.recipientId })
      .from(schema.follower)
      .where(eq(schema.follower.senderId, userId))
      .then((res) => res.map((r) => r.userId));

    const tier1 = await g
      .V(userId)
      .outE("contact")
      .has("isFollowing", false)
      .inV()
      .dedup()
      .order()
      .by(__.property("createdAt"), order.desc)
      .limit(10)
      .id()
      .toList();

    // all incoming people who arent in tier1 and tier2
    const tier2 = await g
      .V(userId)
      .inE("contact")
      .where(__.outV().hasId(P.without(tier1)))
      .where(__.outV().hasId(P.without(following)))
      .outV()
      .dedup()
      .order()
      .by(__.property("createdAt"), order.desc)
      .limit(10)
      .id()
      .toList();

    // remove all tier1 from tier2
    tier2.filter((v) => !tier1.includes(v));

    /*     // get tier 3
    const tier3 = await g
      .V(userId) // Start from the user vertex
      .out("contact") // Traverse to all contacts of the user
      .aggregate("contacts") // Store all contacts in a side-effect named 'contacts'
      .out("contact") // Traverse to contacts of contacts
      .where(__.not(__.inE("contact").from_(userId))) // Filter out vertices that are already contacts of the user
      .groupCount() // Count occurrences of each vertex
      .unfold() // Unroll the map into individual entries
      .where(__.values().is(P.gte(3))) // Keep only entries with count >= 3
      .limit(10) // Limit to 10 results
      .toList(); */

    /*     // tier 4 is just people 2 more edge from all the tier1 vertecies who im not following
    const tier4 = await g
      .V(tier1)
      .out("contact")
      .out("contact")
      .where(__.not(__.inE("contact").from_(userId)))
      .dedup()
      .limit(10)
      .id()
      .toList(); */

    // console.log(tier4);

    const recommendedIds = {
      tier1,
      tier2,
      //tier3,
      // tier4
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
