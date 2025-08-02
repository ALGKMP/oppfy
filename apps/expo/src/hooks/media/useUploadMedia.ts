import { useMutation } from "@tanstack/react-query";

import { validators } from "@oppfy/validators";

import { api } from "~/utils/api";
import {
  calculateCompressionSavings,
  compressImage,
  formatFileSize,
  isCompressionBeneficial,
} from "~/utils/imageCompression";

interface UploadMediaInputBase {
  uri: string;
  caption?: string;
  width: number;
  height: number;
}

export interface UploadMediaInputOnApp extends UploadMediaInputBase {
  recipient: string;
  type: "onApp";
}

export interface UploadMediaInputNotOnApp extends UploadMediaInputBase {
  number: string;
  name: string;
  type: "notOnApp";
}

export type UploadMediaInput = UploadMediaInputOnApp | UploadMediaInputNotOnApp;

const useUploadMedia = () => {
  const createVideoPresignedUrlForUserOnApp =
    api.post.uploadVideoPostForUserOnAppUrl.useMutation();
  const createVideoPresignedUrlForUserNotOnApp =
    api.post.uploadVideoPostForUserNotOnAppUrl.useMutation();
  const createImagePresignedUrlForUserOnApp =
    api.post.uploadPostForUserOnAppUrl.useMutation();
  const createImagePresignedUrlForUserNotOnApp =
    api.post.uploadPostForUserNotOnAppUrl.useMutation();

  const getMediaBlob = async (uri: string) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const uploadVideoMutation = useMutation({
    mutationFn: async (input: UploadMediaInput) => {
      const { uri, caption, width, height } = input;

      const videoBlob = await getMediaBlob(uri);

      const baseData = {
        caption: caption ?? "",
        width,
        height,
      };

      const { presignedUrl, postId } =
        input.type === "onApp"
          ? await createVideoPresignedUrlForUserOnApp.mutateAsync({
              ...baseData,
              recipientUserId: input.recipient,
            })
          : await createVideoPresignedUrlForUserNotOnApp.mutateAsync({
              ...baseData,
              recipientNotOnAppName: input.name,
              recipientNotOnAppPhoneNumber: input.number,
            });

      const response = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": videoBlob.type,
        },
        body: videoBlob,
      });
      console.log("Video blob type:", videoBlob.type);

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      return postId;
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (input: UploadMediaInput) => {
      const { uri, caption, width, height } = input;

      // Get original file size for comparison
      const originalBlob = await getMediaBlob(uri);
      const originalSize = originalBlob.size;

      console.log(
        `📸 Original image: ${width}x${height}, ${formatFileSize(originalSize)}`,
      );

      // Compress the image intelligently
      const compressedImage = await compressImage(uri, "post");

      // Calculate and log compression savings
      const savings = calculateCompressionSavings(
        originalSize,
        compressedImage.size,
      );
      const beneficial = isCompressionBeneficial(
        originalSize,
        compressedImage.size,
      );

      console.log(
        `🗜️  Compressed image: ${compressedImage.width}x${compressedImage.height}, ${formatFileSize(compressedImage.size)}`,
      );
      console.log(
        `💾 Compression saved ${formatFileSize(savings.savedBytes)} (${savings.savedPercentage}%) - ${beneficial ? "✅ Beneficial" : "⚠️ Minimal benefit"}`,
      );

      // Get the compressed blob
      const photoBlob = await getMediaBlob(compressedImage.uri);

      const parsedMediaType = validators.imageContentType.safeParse(
        photoBlob.type,
      );

      if (!parsedMediaType.success) {
        throw new Error("Invalid media type");
      }

      const baseData = {
        caption: caption ?? "",
        width: compressedImage.width,
        height: compressedImage.height,
        contentLength: photoBlob.size,
        contentType: parsedMediaType.data,
      };

      const { presignedUrl, postId } =
        input.type === "onApp"
          ? await createImagePresignedUrlForUserOnApp.mutateAsync({
              ...baseData,
              recipientUserId: input.recipient,
            })
          : await createImagePresignedUrlForUserNotOnApp.mutateAsync({
              ...baseData,
              recipientNotOnAppName: input.name,
              recipientNotOnAppPhoneNumber: input.number,
            });

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: photoBlob,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      console.log(
        `🚀 Successfully uploaded post image (${formatFileSize(photoBlob.size)})`,
      );

      return postId;
    },
  });

  return {
    uploadVideoMutation,
    uploadPhotoMutation,
  };
};

export default useUploadMedia;
