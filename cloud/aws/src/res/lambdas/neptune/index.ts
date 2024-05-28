import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import gremlin from "gremlin";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("caLled");
  const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
  const Graph = gremlin.structure.Graph;

  const dc = new DriverRemoteConnection(
    `wss://neptunedbcluster-gddnnc9yrqan.cluster-ch4ias0oqqnx.us-east-1.neptune.amazonaws.com:8192/gremlin`,
    {},
  );
  console.log("here1");
  const graph = new Graph();
  const g = graph.traversal().withRemote(dc);
  console.log("here2");

  const result = await g.V().toList();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: result.toString(),
    }),
  };
};
