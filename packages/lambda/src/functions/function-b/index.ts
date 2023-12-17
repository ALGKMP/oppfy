import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";
import { isEven } from "@oriano-dev/is-even";

export const handler = async (
  event: S3Event,
  _context: Context,
): Promise<APIGatewayProxyResult> => {

  const even = isEven.number(2);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `IS EVEN: ${even}`,
    }),
  };
};
