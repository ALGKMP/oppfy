import type { z } from "zod";

import type { sharedValidators } from "@oppfy/validators";

import { MuxRepository } from "../../repositories/mux/mux";

export type PostMetadata = z.infer<typeof sharedValidators.aws.metadataSchema>;

export class MuxService {
  private muxRepository = new MuxRepository();

  async PresignedUrlWithPostMetadata(metadata: PostMetadata) {
    return await this.muxRepository.createDirectUpload(metadata);
  }
}
