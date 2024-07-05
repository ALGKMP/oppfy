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
  process: { P, order, column, statics: __ },
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

    console.log("Following", following);

    const tier1 = await g
      .V(userId)
      .outE("contact")
      .has("isFollowing", false)
      .inV()
      .dedup()
      .order()
      .by("createdAt", order.desc)
      .limit(10)
      .id()
      .toList();

    console.log("Tier 1", tier1);

    // all incoming people who arent in tier1 and tier2
    const tier2 = await g
      .V(userId)
      .inE("contact")
      .where(__.outV().hasId(P.without(tier1)))
      .where(__.outV().hasId(P.without(following)))
      .outV()
      .dedup()
      .order()
      .by("createdAt", order.desc)
      .limit(30)
      .id()
      .toList();

    // remove all tier1 from tier2
    tier2.filter((v) => !tier1.includes(v));

    console.log("Tier 2", tier2);

    /*     // TODO: adjust the param below for finetuning
    const tier3 = await g
      .V(userId)
      .out("contact")
      .aggregate("contacts")
      .out("contact")
      .where(__.not(__.where(__.inE("contact").outV().hasId(userId))))
      .where(
        __.not(__.where(__.inE("contact").outV().hasId(P.without(following)))),
      )
      .groupCount()
      .unfold()
      .filter(__.select(column.values).is(P.gte(1)))
      .limit(15)
      .id()
      .toList();

    console.log("Tier 3", tier3);
    totalRecCount += tier3.length; */

    const tier3 = await g
      .V(userId)
      .out("contact")
      .aggregate("contacts")
      .out("contact")
      .where(__.not(__.where(__.inE("contact").outV().hasId(userId))))
      .where(__.inE("contact").outV().hasId(P.without(tier1)))
      .where(__.inE("contact").outV().hasId(P.without(tier2)))
      .where(__.inE("contact").outV().hasId(P.without(following)))
      .groupCount()
      .unfold()
      .limit(15)
      .toList();

    console.log("Tier 3", tier3);

    /*     // tier 4 is just people 2 more edge from all the tier1 vertecies who im not following
    const tier4 = await g
      .V(userId)
      .out("contact")
      .out("contact")
      .where(__.not(__.inE("contact").from_(userId)))
      .dedup()
      .limit(10)
      .id()
      .toList();

    console.log(tier4);
 */
    const recommendedIds = {
      tier1,
      tier2,
      // tier3,
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
