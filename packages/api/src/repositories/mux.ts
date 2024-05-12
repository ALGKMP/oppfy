import { mux } from "@acme/db";

import { handleMuxErrors } from "../errors";

export class MuxRepository {
  
  @handleMuxErrors
  async createDirectUpload() {
    return await mux.video.uploads.create({
      new_asset_settings: { playback_policy: ["public"], encoding_tier: "baseline"},
      cors_origin: '*',
    });
  }
}
