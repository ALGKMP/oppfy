import { useState } from "react";
import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { api } from "~/utils/api";

interface UploadToMuxMutationInput {
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
    async ({ uri, caption, recipientId }: UploadToMuxMutationInput) => {
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

  return {
    uploadVideoMutation,
  };
};

export default useUploadMedia;
