// import type { HeadObjectCommandInput } from "@aws-sdk/client-s3";
// import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import type { APIGatewayProxyResult, Context, S3Event } from "aws-lambda";

// export interface Metadata {
//   authorId: string;
//   caption?: string;
//   tags?: string;
// }

// export const region = "us-east-1";
// export const bucket = "myawsbucket-0xc3";

// export const kebabToPascal = (str: string) => {
//   return str.replace(/(^|-)./g, (match) =>
//     match.charAt(match.length - 1).toUpperCase(),
//   );
// };

// export const isMetadata = (metadata: unknown): metadata is Metadata => {
//   const m = metadata as Metadata;
//   return (
//     m.authorId !== undefined && m.caption !== undefined && m.tags !== undefined
//   );
// };

// export const camelToKebab = (str: string) => {
//   return (
//     str
//       // Insert a hyphen before each uppercase letter and convert that letter to lowercase
//       .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
//       .toLowerCase()
//   );
// };

// export const pascalToKebab = (str: string) => {
//   return (
//     str
//       // Insert a hyphen before each uppercase letter (except the first one) and convert that letter to lowercase
//       .replace(/([a-z])([A-Z])/g, "$1-$2")
//       .toLowerCase()
//   );
// };

// // TODO: we can upload our env vars to lambda through our template.yaml file
// const AWS_ACCESS_KEY_ID = "AKIA5OJS54YNU5J6NZNU";
// const AWS_SECRET_ACCESS_KEY = "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";

// export const handler = async (
//   event: S3Event,
//   _context: Context,
// ): Promise<APIGatewayProxyResult> => {
//   const record = event.Records[0];
//   const objectKey = record?.s3.object.key;
//   const objectBucket = record?.s3.bucket.name;

//   const s3Client = new S3Client({
//     region: region,
//     credentials: {
//       accessKeyId: AWS_ACCESS_KEY_ID,
//       secretAccessKey: AWS_SECRET_ACCESS_KEY,
//     },
//   });

//   const headObjectCommandInput: HeadObjectCommandInput = {
//     Bucket: objectBucket,
//     Key: objectKey,
//   };
//   const command = new HeadObjectCommand(headObjectCommandInput);

//   // Send this jawn to S3
//   const response = await s3Client.send(command);

//   const { Metadata } = response;

//   // if (!isMetadata(Metadata)) {
//   //   // TODO: Handle this error
//   //   return {
//   //     statusCode: 400,
//   //     body: JSON.stringify({
//   //       message: "No Metadata found on object",
//   //     }),
//   //   };
//   // }
//   if (!Metadata) {
//     // TODO: Handle this error
//     return {
//       statusCode: 400,
//       body: JSON.stringify({
//         message: "No Metadata found on object",
//       }),
//     };
//   }

//   const { authorId, caption, tags } = Metadata;

//   console.log(`Tags: ${tags}`);
//   console.log(`Caption: ${caption}`);
//   console.log(`AuthorId: ${authorId}`);

//   // TODO NOT FETCHING RIGHT NOW???????????
//   const fetchResponse = await fetch(
//     "https://236a-76-68-71-153.ngrok-free.app/api/lambdaHitThis",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         authorId: "6Hax8ognl0gOjmsSfWzVDAcSeEr1",
//         caption: "test caption",
//         tags: ["otherUserKey1,otherUserKey2"],
//         objectKey: objectKey,
//       }),
//     },
//   );

//   console.log(`STATUS: ${fetchResponse.status}`);

//   return {
//     statusCode: 200,
//     body: JSON.stringify({
//       message: "OpenAPI Endpoint Hit",
//     }),
//   };
// };

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
