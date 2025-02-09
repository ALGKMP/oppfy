import type { z } from "zod";

import { mux } from "@oppfy/mux";
import type { sharedValidators } from "@oppfy/validators";

import { handleMuxErrors } from "../../errors";

export type PostMetadata = z.infer<typeof sharedValidators.aws.metadataSchema>;

export class MuxService {
  @handleMuxErrors
  async PresignedUrlWithPostMetadata(metadata: PostMetadata) {
    return await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        test: false,
        encoding_tier: "smart",
        mp4_support: "standard",
        playback_policy: ["public"],
        passthrough: JSON.stringify(metadata),
      },
    });
  }

  @handleMuxErrors
  async getAsset(assetId: string) {
    return await mux.video.assets.retrieve(assetId);
  }

  @handleMuxErrors
  async deleteAsset(assetId: string) {
    return await mux.video.assets.delete(assetId);
  }

  @handleMuxErrors
  async updateAsset(assetId: string, settings: object) {
    return await mux.video.assets.update(assetId, settings);
  }
}
