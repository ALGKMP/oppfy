import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

export const handler = async (
  event: S3Event,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log(`PRINTING OUT RANDOM SHIT`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "OpenAPI Endpoint Hit",
    }),
  };
};