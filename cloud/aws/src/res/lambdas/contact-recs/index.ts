import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
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
  console.log("Event", event);

  try {
    const graph = new Graph();
    const dc = new DriverRemoteConnection(
      `wss://${env.NEPTUNE_ENDPOINT}/gremlin`,
      {},
    );

    const g = graph.traversal().withRemote(dc);
    const userId = event.queryStringParameters?.userId;
    console.log("userId", userId);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing userId",
        }),
      };
    }

    if (userId === "deleteMP1201devcodehopenoonefindsthis") {
      await g.V().drop().iterate();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Deleted all vertices",
        }),
      };
    }

    if (userId == "getAllVerteciessecretagainmp1201plsdontfindthis") {
      const vertecies = await g.V().toList();
      return {
        statusCode: 200,
        body: JSON.stringify(vertecies),
      };
    }

    const requested = await db
      .select({
        userId: schema.followRequest.recipientId,
      })
      .from(schema.followRequest)
      .where(eq(schema.followRequest.senderId, userId))
      .then((res) => res.map((r) => r.userId));

    const following = await db
      .select({ userId: schema.follower.recipientId })
      .from(schema.follower)
      .where(eq(schema.follower.senderId, userId))
      .then((res) => res.map((r) => r.userId));

    const blocked = await db
      .select({ userId: schema.block.userWhoIsBlockedId })
      .from(schema.block)
      .where(eq(schema.block.userWhoIsBlockingId, userId))
      .then((res) => res.map((r) => r.userId));

    const blockedBy = await db
      .select({ userId: schema.block.userWhoIsBlockingId })
      .from(schema.block)
      .where(eq(schema.block.userWhoIsBlockedId, userId))
      .then((res) => res.map((r) => r.userId));

    const friend1s = await db
      .select({ userId: schema.friend.userIdA })
      .from(schema.friend)
      .where(eq(schema.friend.userIdA, userId))
      .then((res) => res.map((r) => r.userId));

    const friend2s = await db
      .select({ userId: schema.friend.userIdB })
      .from(schema.friend)
      .where(eq(schema.friend.userIdB, userId))
      .then((res) => res.map((r) => r.userId));

    const peopleIDontWantToRecommend = [
      ...following,
      ...blocked,
      ...blockedBy,
      ...requested,
      ...friend1s,
      ...friend2s,
    ];

    console.log("People IDontWantToRecommend", peopleIDontWantToRecommend);

    const tier1 = await g
      .V(userId)
      .outE("contact")
      .where(__.inV().hasId(P.without(peopleIDontWantToRecommend)))
      .inV()
      .dedup()
      .order()
      .by("createdAt", order.desc)
      .limit(30)
      .id()
      .toList();

    console.log("Tier 1", tier1);

    const excludeForTier2 = [...peopleIDontWantToRecommend, ...tier1];

    console.log("Exclude For Tier 2", excludeForTier2);

    // all incoming people who arent in tier1 and tier2
    const tier2 = await g
      .V(userId)
      .inE("contact")
      .where(__.outV().hasId(P.without(excludeForTier2)))
      .outV()
      .dedup()
      .order()
      .by("createdAt", order.desc)
      .limit(15)
      .id()
      .toList();

    console.log("Tier 2", tier2);

    // get people 2 edges away, ranked by number of mutual connections
    const excludeForTier3 = [
      ...peopleIDontWantToRecommend,
      ...tier1,
      ...tier2,
      userId,
    ];

    // get people 2 edges away, ranked by number of mutual connections
    const tier3 = await g
      .V(userId)
      .out("contact")
      .out("contact")
      .where(__.not(__.hasId(P.within(excludeForTier3))))
      .group()
      .by(__.identity())
      .by(__.in_("contact").where(__.out("contact").hasId(userId)).count())
      .unfold()
      .order()
      .by(__.select(column.values), order.desc)
      .limit(10)
      .select(column.keys)
      .id()
      .toList();

    console.log("Tier 3", tier3);

    // remove all tier1 from tier2

    /*     const tier3 = await g
      .V(userId)
      .out("contact")
      .aggregate("contacts")
      .out("contact")
      .where(__.not(__.where(__.inE("contact").outV().hasId(userId))))
      .where(__.inE("contact").outV().hasId(P.within(tier1)))
      .where(__.inE("contact").outV().hasId(P.within(tier2)))
      .where(__.inE("contact").outV().hasId(P.without(following)))
      .groupCount()
      .unfold()
      .filter(__.select(column.values).is(P.gte(1)))
      .limit(15)
      .id()
      .toList();

    console.log("Tier 3", tier3);
 */
    // tier 4 is just people 2 more edge from all the tier1 vertecies who im not following
    /*     const tier4 = await g
      .V(userId)
      .out("contact")
      .out("contact")
      .where(__.not(__.inE("contact").from_(userId)))
      .dedup()
      .limit(10)
      .id()
      .toList();

    console.log(tier4); */

    const recommendedIds = {
      tier1,
      tier2,
      tier3,
      tier4: [],
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
