import { z } from "zod";
import { userId, key } from "../utils";

const profileSchemas = {
    createPresignedUrl: z.object({
        contentLength: z.number(),
        contentType: z.string(),
    })
    .refine((data) => data.contentLength <= 5 * 1024 * 1024, {
        message: "File too large",  // Validates file size to not exceed 5 MB
    })
    .refine(
        (data) => ["image/jpeg", "image/png", "image/gif", "image"].includes(data.contentType),
        {
            message: "Invalid file type",  // Validates allowed image content types
        },
    ),
    
    uploadProfilePhotoOpenApi: z.object({
        userId,
        key
    }),
    
    getProfilePictureUrl: z.object({
        userId
    }),
    
    removeProfilePhoto: z.object({
        key
    }),
};

export default profileSchemas