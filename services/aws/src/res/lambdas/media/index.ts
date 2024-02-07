import type { HeadObjectCommandInput } from "@aws-sdk/client-s3";
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";
// import {db} from "../../../../../../packages/db/src" // TODO: fix this import
import { Metadata } from "../../../utils";


export const region = "us-east-1";
export const bucket = "myawsbucket-0xc3";

// TODO: we can upload our env vars to lambda through our template.yaml file
const AWS_ACCESS_KEY_ID = "AKIA5OJS54YNU5J6NZNU";
const AWS_SECRET_ACCESS_KEY = "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";

export const handler = async (
  event: S3Event,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log(`Records: ${JSON.stringify(event.Records)}`)

  const record = event.Records[0];
  console.log("Record: ", record)

  if (!record) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No record found in event",
      }),
    };
  }

  const objectKey = record?.s3.object.key;
  const objectBucket = record?.s3.bucket.name;

  const s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });

  const headObjectCommandInput: HeadObjectCommandInput = {
    Bucket: objectBucket,
    Key: objectKey,
  };

  const command = new HeadObjectCommand(headObjectCommandInput);

  try {
    const response = await s3Client.send(command);

    const metadata = response.Metadata as Metadata | undefined;

    if (metadata === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "No Metadata found on object",
        }),
      };
    }

    console.log(`Response: ${JSON.stringify(response)}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Object found in S3",
      }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting object from S3",
      }),
    };
    }

  // const { Metadata } = response;


  // if (!Metadata) {
  //   // TODO: Handle this error
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({
  //       message: "No Metadata found on object",
  //     }),
  //   };
  // }

  // const { authorId, caption, tags } = Metadata;

  // console.log(`Tags: ${tags}`);
  // console.log(`Caption: ${caption}`);
  // console.log(`AuthorId: ${authorId}`);
};