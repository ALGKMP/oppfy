import { mux } from "@oppfy/mux";

import { handleMuxErrors } from "../errors";

export class MuxRepository {
  @handleMuxErrors
  async createDirectUpload(
    authorId: string,
    recipientId: string,
    caption: string | null = null,
  ) {
    const metadata = JSON.stringify({
      authorId,
      recipientId,
      caption,
    });
    return await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "smart",
        passthrough: metadata,
        test: true,
        mp4_support: "standard",
      },
      cors_origin: "*",
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
