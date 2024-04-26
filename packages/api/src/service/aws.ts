// src/utilities/AWSS3Service.ts
import { s3 } from "@acme/db";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const AWSS3Service  = {

    // TODO: Lambda functions triggered on upload that optimize image size and format.
    createPutPresignedUrl : async (bucket: string, key: string, contentLength: number, contentType: string): Promise<string> => {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
            ContentLength: contentLength,
        });
        return getSignedUrl(s3, command, { expiresIn: 300 });  // 5 minutes
    },

    createGetPresignedUrl: async (bucket: string, key: string): Promise<string> => {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });
        return getSignedUrl(s3, command, { expiresIn: 300 });  // 5 minutes
    },

    getObject: async (bucket: string, key: string) => {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });

        try {
            const data = await s3.send(command);
            console.log(`Object retrieved: ${key}`);
            return data;
        } catch (err) {
            console.error(`Error retrieving object: ${key}`, err);
            throw new Error("Failed to retrieve object from S3");
        }
    },

    deleteObject: async (bucket: string, key: string) => {
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        })

        try {
            const response = await s3.send(command);
            console.log(response);
          } catch (err) {
            console.error(err);
            throw new Error("Failed to delete object from S3");
          };
    },

    uploadProfilePictureUrl: async (userId: string, contentLength: number, contentType: string): Promise<string> => {
       const bucket = process.env.S3_BUCKET_NAME!; 
        return await AWSS3Service.createPutPresignedUrl(bucket, `profile-pictures/${userId}.jpg`, contentLength, contentType);
    },

    getProfilePictureUrl: async (userId: string): Promise<string> => {
        const bucket = process.env.S3_BUCKET_NAME!;
        return await AWSS3Service.createGetPresignedUrl(bucket, `profile-pictures/${userId}.jpg`);
    },

    deleteObjectProfilePicture: async (userId: string) => {
        const bucket = process.env.S3_BUCKET_NAME!;
        const key = `profile-pictures/${userId}.jpg`;
        return await AWSS3Service.deleteObject(bucket, key)
    },
}

export default AWSS3Service;
