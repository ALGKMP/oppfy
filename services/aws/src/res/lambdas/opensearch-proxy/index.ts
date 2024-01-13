import { Client, QueryD } from "@elastic/elasticsearch";
import type { APIGatewayProxyHandler } from "aws-lambda";

interface SearchRequest {
  index: string;
  query: any;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing request body" }),
    };
  }

  let searchRequest: SearchRequest;
  try {
    searchRequest = JSON.parse(event.body) as SearchRequest;
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request body" }),
    };
  }

  const client = new Client({
    node: process.env.OPENSEARCH_DOMAIN_ENDPOINT,
  });

  try {
    const response = await client.search({
      index: searchRequest.index,
      body: {
        query: searchRequest.query as QueryDslQueryContainer ,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.body.hits.hits),
    };
  } catch (error) {
    console.error("OpenSearch query error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error querying OpenSearch" }),
    };
  }
};
