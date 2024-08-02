import { mux } from "@oppfy/mux";

import { handleMuxErrors } from "../../errors";

export class MuxRepository {
  @handleMuxErrors
  async createDirectUpload(metadata: object) {
    return await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        // test: true,
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
