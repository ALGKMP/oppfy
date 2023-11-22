import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

export interface Metadata {
  [index: string]: string;
  AuthorId: string;
  Caption: string;
  Tags: string;
}

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(context, null, 2)}`);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world OLA ESPANEOL HALBO DEUTSCH',
        }),
    };
};