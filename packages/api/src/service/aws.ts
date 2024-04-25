// src/utilities/AWSS3Service.ts
import { s3 } from "@acme/db";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const AWSS3Service  = {

    createPresignedUrl : async (userId: string, contentLength: number, contentType: string): Promise<string> => {
        const bucket = process.env.S3_BUCKET_NAME;
        const key = `profile-pictures/${userId}.jpg`;

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType,
            ContentLength: contentLength,
        });

        return getSignedUrl(s3, command, { expiresIn: 300 });  // 5 minutes
    },

    removeObject: async (key: string, bucket: string) => {
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        })
        // TODO: Delete from S3 google when you're off the plane

    }

}

export default AWSS3Service;
