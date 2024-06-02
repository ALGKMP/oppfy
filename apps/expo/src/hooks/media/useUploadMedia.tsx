import { useState } from "react";
import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { sharedValidators } from "@oppfy/validators";

import { api } from "~/utils/api";

export interface UploadMediaInput {
  uri: string;
  recipientId: string;
  caption?: string;
}

const useUploadMedia = () => {
  const createMuxVideoPresignedUrl =
    api.post.createMuxVideoPresignedUrl.useMutation();
  const createPresignedUrlForPost =
    api.post.createPresignedUrlForPost.useMutation();

  const getMediaBlob = async (uri: string) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const uploadVideoMutation = useMutation(
    async ({ uri, caption, recipientId }: UploadMediaInput) => {
      const videoBlob = await getMediaBlob(uri);

      const presignedUrl = await createMuxVideoPresignedUrl.mutateAsync({
        caption,
        recipientId,
      });

      const response = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": videoBlob.type,
        },
        body: videoBlob,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }
    },
  );

  const uploadPhotoMutation = useMutation(
    async ({ uri, caption, recipientId }: UploadMediaInput) => {
      const photoBlob = await getMediaBlob(uri);

      const parsedMediaType = sharedValidators.media.postContentType.safeParse(
        photoBlob.type,
      );

      if (!parsedMediaType.success) {
        throw new Error("Invalid media type");
      }

      const presignedUrl = await createPresignedUrlForPost.mutateAsync({
        caption,
        recipient: recipientId,
        contentLength: photoBlob.size,
        contentType: parsedMediaType.data,
      });

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: photoBlob,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
    },
  );

  return {
    uploadVideoMutation,
    uploadPhotoMutation,
  };
};

export default useUploadMedia;
