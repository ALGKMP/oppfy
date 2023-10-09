import { z } from "zod";
import {
    S3Client, 
    GetObjectCommand, 
    DeleteObjectCommand, 
    PutObjectCommand,
} from "@aws-sdk/client-s3";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const BUCKET_NAME = "oppfy";

export const s3Router = createTRPCRouter({
    upload: protectedProcedure.input(z.object({
        file: z.string(), // Replace with suitable file type
        key: z.string(),
    })).mutation(async ({ctx, input }) => {
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: input.key,
            Body: input.file,
        };
        await ctx.s3Client.send(new PutObjectCommand(uploadParams));
        return { success: true, message: "File uploaded successfully." };
    }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ctx, input}) => {
        const deleteParams = {
            Bucket: BUCKET_NAME,
            Key: input ,
        };
        await ctx.s3Client.send(new DeleteObjectCommand(deleteParams));
        return { success: true, message: "File deleted successfully." };
    }),

    // TODO: Update - update bio, location, tags, etc... in db 


    fetch: protectedProcedure.input(z.string()).query(async ({ctx, input}) => {
        const getParams = {
            Bucket: BUCKET_NAME,
            Key: input,
        };
        const data = await ctx.s3Client.send(new GetObjectCommand(getParams));
        // You might want to stream the data or send it in a particular format
        return data;
    }),
})