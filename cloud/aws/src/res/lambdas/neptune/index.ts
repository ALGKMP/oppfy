import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const schema = z.object({
    body: z.string(),
  });
  const { body } = schema.parse(JSON.parse(event.body || "{}"));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, the body is: ${body}`,
    }),
  };
};
