import { z } from "zod";

export const postContentType = z.enum(["image/jpeg", "image/png", "image/gif"]);
