import { Mux as MuxClient } from "@mux/mux-node";

import { env } from "@oppfy/env";

interface GetPresignedUrlForVideoParams {
  metadata: { postid: string };
}

export class Mux {
  private client: MuxClient;

  constructor() {
    this.client = new MuxClient({
      tokenId: env.MUX_TOKEN_ID,
      tokenSecret: env.MUX_TOKEN_SECRET,
    });
  }

  getStreamUrl(assetId: string): string {
    return `https://stream.mux.com/${assetId}.m3u8`;
  }

  getThumbnailUrl(assetId: string): string {
    return `https://image.mux.com/${assetId}/thumbnail.jpg`;
  }

  async getPresignedUrlForVideoUpload({
    metadata,
  }: GetPresignedUrlForVideoParams) {
    const upload = await this.client.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        encoding_tier: "smart",
        playback_policy: ["public"],
        mp4_support: "standard",
        passthrough: JSON.stringify(metadata),
      },
      test: false,
    });

    return upload.url;
  }

  async deleteAsset(assetId: string) {
    await this.client.video.assets.delete(assetId);
  }

  verifyWebhookSignature(payload: string, headers: Record<string, string>) {
    return this.client.webhooks.verifySignature(payload, headers);
  }
}
