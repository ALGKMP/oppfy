import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import gremlin from "gremlin";

// TODO: So many type "any" it's starting to look like a JavaScript project

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;

const NEPTUNE_ENDPOINT = process.env.NEPTUNE_ENDPOINT;
const NEPTUNE_PORT = process.env.NEPTUNE_PORT || 8182;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log("Lambda invoked");

  let dc: any;
  let g: any;

  console.log("Connecting to Neptune", NEPTUNE_ENDPOINT, NEPTUNE_PORT);

  try {
    console.log("checking status");
    // checkling status of lambda
    const resp = await fetch(`https://${NEPTUNE_ENDPOINT}/status`);

    console.log(resp.status);
    console.log(await resp.text());

    dc = new DriverRemoteConnection(
      `wss://${NEPTUNE_ENDPOINT}/gremlin`,
      {},
    );
    console.log("Remote connection established");

    const graph = new Graph();
    g = graph.traversal().withRemote(dc);
    console.log("Graph traversal initialized");

    const result = await g.V().toList();
    console.log("Query executed", result);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "queried the graph",
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
