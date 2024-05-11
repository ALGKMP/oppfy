import { mux } from "@acme/db";

import { handleMuxErrors } from "../errors";

export class MuxRepository {
  @handleMuxErrors
  async createDirectUpload(params: { cors_origin: string }) {
    const { cors_origin } = params;
    return await mux.video.uploads.create({
    //   new_asset_settings: { playback_policy: "public" },
      cors_origin: cors_origin,
    });
  }
}
