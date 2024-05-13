import { mux } from "@acme/db";

import { handleMuxErrors } from "../errors";

export class MuxRepository {

  @handleMuxErrors
  async createDirectUpload() {
    return await mux.video.uploads.create({
      new_asset_settings: { playback_policy: ["public"], encoding_tier: "smart", passthrough: "some data", test: true, mp4_support: "standard"},
      cors_origin: '*',
    },
  );
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
