import type { z } from "zod";

import type { sharedValidators } from "@oppfy/validators";

import { MuxRepository } from "../../repositories/mux/mux";

export type PostMetadataUserOnApp = z.infer<
  typeof sharedValidators.aws.s3ObjectMetadataForUserOnAppSchema
>;

export type PostMetadataUserNotOnApp = z.infer<
  typeof sharedValidators.aws.s3ObjectMetadataForUserNotOnAppSchema
>;

export type PostMetadata = PostMetadataUserOnApp | PostMetadataUserNotOnApp;

export class MuxService {
  private muxRepository = new MuxRepository();

  async PresignedUrlWithPostMetadata(metadata: PostMetadata) {
    return await this.muxRepository.createDirectUpload(metadata);
  }
}
