import Mux from "@mux/mux-node";

import { env } from "@oppfy/env";

interface GetPresignedUrlForVideoOptions {
  author: string;
  recipient: string;
  caption: string;
  height: string;
  width: string;
  postid: string;
}

export class MuxService {
  private client: Mux;

  constructor() {
    this.client = new Mux({
      tokenId: env.MUX_TOKEN_ID,
      tokenSecret: env.MUX_TOKEN_SECRET,
    });
  }

  /**
   * Creates a presigned URL for video upload to Mux
   */
  async getPresignedUrlForVideo(options: GetPresignedUrlForVideoOptions) {
    return await this.client.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        test: false,
        encoding_tier: "smart",
        mp4_support: "standard",
        playback_policy: ["public"],
        passthrough: JSON.stringify({
          author: options.author,
          recipient: options.recipient,
          caption: options.caption,
          height: options.height,
          width: options.width,
          postid: options.postid,
        }),
      },
    });
  }

  /**
   * Gets the streaming URL for a video
   */
  getStreamUrl(assetId: string): string {
    return `https://stream.mux.com/${assetId}.m3u8`;
  }

  /**
   * Gets the thumbnail URL for a video
   */
  getThumbnailUrl(assetId: string): string {
    return `https://image.mux.com/${assetId}/thumbnail.jpg`;
  }
}

// Export a singleton instance
export const mux = new MuxService();
