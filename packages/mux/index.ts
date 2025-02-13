import Mux from "@mux/mux-node";

import { env } from "@oppfy/env";

interface GetPresignedUrlForVideoOptions {
  author: string;
  recipient: string;
  caption?: string;
  height?: number;
  width?: number;
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
  async getPresignedUrlForVideo({
    author,
    recipient,
    caption,
    height,
    width,
    postid,
  }: GetPresignedUrlForVideoOptions) {
    const upload = await this.client.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
        mp4_support: "standard",
        passthrough: JSON.stringify({
          author,
          recipient,
          caption,
          height,
          width,
          postid,
        }),
      },
      test: false,
    });

    return {
      url: upload.url,
      id: upload.id,
    };
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
