import { createEnv } from "@t3-oss/env-core";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import gremlin from "gremlin";
import { z } from "zod";

import { db, eq, schema } from "@oppfy/db";

const {
  driver: { DriverRemoteConnection },
  structure: { Graph },
  process: { P, order, column, statics: __ },
} = gremlin;

const env = createEnv({
  server: {
    NEPTUNE_ENDPOINT: z.string().min(1),
  },
  runtimeEnv: process.env,
});

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
/*     const graph = new Graph();
    const dc = new DriverRemoteConnection(
      `wss://${env.NEPTUNE_ENDPOINT}/gremlin`,
      {},
    );
    const g = graph.traversal().withRemote(dc);
    const vertecies = await g.V().toList();
    return {
      statusCode: 200,
      body: JSON.stringify(vertecies),
    };
 */
    /*     const g = graph.traversal().withRemote(dc);
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing userId",
        }),
      };
    }
 */
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "hi",
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "some error happened",
      }),
    };
  }
};
