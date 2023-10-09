import { z } from "zod";
import {
    GetObjectCommand, 
    DeleteObjectCommand, 
    PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const profilePhotoBucket = "oppfy-profile-pictures";
import { Prisma } from '@prisma/client';


export const profilePhotoRouter = createTRPCRouter({
    upload: protectedProcedure.input(z.object({
        file: z.string(), // Replace with suitable file type
        key: z.string(),
    })).mutation(async ({ctx, input }) => {
        const uploadParams = {
            Bucket: profilePhotoBucket,
            Key: input.key,
            Body: input.file,
        };
        try {

            // R2 
            const s3Response = await ctx.s3Client.send(new PutObjectCommand(uploadParams));
            if (!s3Response) {
                return { success: false, message: "Error uploading file to R2." };
            }

            // Prisma
            const prismaInput: Prisma.ProfilePhotoCreateInput = {
                user: { connect: { id: ctx.session.uid } },
                s3Key: input.key,
            }

            const prismaResponse = await ctx.prisma.profilePhoto.create({
                data: prismaInput,
            });
            
            if (!prismaResponse) {
                return { success: false, message: "Error uploading file to prisma." };
            }

        }
        catch(err) {
            console.log(err);
            return { success: false, message: "Error uploading file to R2." };
        }

        
        return { success: true, message: "File uploaded successfully." };
    }),

    delete: protectedProcedure.mutation(async ({ctx}) => {

        const prismaDeleteInput: Prisma.ProfilePhotoDeleteArgs = {
            where: { userId: ctx.session.uid },
        };

        try{
            // first get the key from prisma
            const photo = await ctx.prisma.profilePhoto.findUnique(prismaDeleteInput);
            if (!photo) {
                console.log("Error: no photo associated with user found in prisma.");
                return { success: false, message: "Error: unable to retrieve key from prisma -> can't delete profile photo without the s3Key." };
            }
            const s3DeleteInput = {
                Bucket: profilePhotoBucket,
                Key: photo.s3Key ,
            };
            const res = await ctx.s3Client.send(new DeleteObjectCommand(s3DeleteInput));
            if (!res){
                return { success: false, message: "Error deleting file from R2." };
            }

            const prismaDeleted = await ctx.prisma.profilePhoto.delete(prismaDeleteInput);

            if (!prismaDeleted) {
                console.log("Error: problem deleting profile photo from prisma.");
                return { success: false, message: "Error deleting profile photo." };
            }
            return { success: true, message: "File deleted successfully." };
        }
        catch (err) {
            console.log(err);
            return { success: false, message: "Error deleting the profile photo." };
        }
    }),

    // TODO: Update - update bio, location, tags, etc... in db 


    getPhoto: protectedProcedure.query(async ({ctx}) => {
        // get the photo key from prisma
        try {

            const prismaFindUniqueInput: Prisma.ProfilePhotoFindUniqueArgs = {
                where: { userId: ctx.session.uid },
            };
            const photo = await ctx.prisma.profilePhoto.findUnique(prismaFindUniqueInput);

            if (!photo) {
                console.log("Error: no photo associated with user found in prisma.");
                // TODO: return default photo
                return { success: false, message: "Error getting profile photo." };
            }
            console.log(`photo key retrieved fomr prisma: ${photo.s3Key}`);
            const s3GetObjectCommandInput= {
                Bucket: profilePhotoBucket,
                Key: photo.s3Key,
            };
            const data = await ctx.s3Client.send(new GetObjectCommand(s3GetObjectCommandInput));

            if (!data) {
                console.log("Error: problem getting profile photo from R2.");
                return { success: false, message: "Error getting file from R2." };
            }

                console.log("Success: profile photo retrieved from R2")
                return data;
        } catch(err) {
            console.log(err);
            return { success: false, message: "Error getting profile photo." };
        }

    }),
})