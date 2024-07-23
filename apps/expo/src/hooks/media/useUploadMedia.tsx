import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { sharedValidators } from "@oppfy/validators";

import { api } from "~/utils/api";

interface UploadMediaInputBase {
  uri: string;
  caption?: string;
  width: number;
  height: number;
}

interface UploadMediaInputOnApp extends UploadMediaInputBase {
  recipient: string;
  type: "onApp";
}

interface UploadMediaInputNotOnApp extends UploadMediaInputBase {
  number: string;
  type: "notOnApp";
}

type UploadMediaInput = UploadMediaInputOnApp | UploadMediaInputNotOnApp;

const useUploadMedia = () => {
  const createPresignedUrlForVideoPost =
    api.post.createPresignedUrlForVideoPost.useMutation();
  const createPresignedUrlForImagePost =
    api.post.createPresignedUrlForImagePost.useMutation();

  const getMediaBlob = async (uri: string) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const uploadVideoMutation = useMutation(async (input: UploadMediaInput) => {
    const { uri, caption, width, height } = input;

    const videoBlob = await getMediaBlob(uri);

    const baseData = {
      caption,
      width: width.toString(),
      height: height.toString(),
    };

    const presignedUrl =
      input.type === "onApp"
        ? await createPresignedUrlForVideoPost.mutateAsync({
            ...baseData,
            type: "onApp",
            recipient: input.recipient,
          })
        : await createPresignedUrlForVideoPost.mutateAsync({
            ...baseData,
            type: "notOnApp",
            number: input.number,
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
  });

  const uploadPhotoMutation = useMutation(async (input: UploadMediaInput) => {
    const { uri, caption, width, height } = input;

    const photoBlob = await getMediaBlob(uri);

    const parsedMediaType = sharedValidators.media.postContentType.safeParse(
      photoBlob.type,
    );

    if (!parsedMediaType.success) {
      throw new Error("Invalid media type");
    }

    const baseData = {
      caption,
      width: width.toString(),
      height: height.toString(),
      contentLength: photoBlob.size,
      contentType: parsedMediaType.data,
    };

    const presignedUrl =
      input.type === "onApp"
        ? await createPresignedUrlForImagePost.mutateAsync({
            ...baseData,
            type: "onApp",
            recipient: input.recipient,
          })
        : await createPresignedUrlForImagePost.mutateAsync({
            ...baseData,
            type: "notOnApp",
            number: input.number,
          });

    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: photoBlob,
    });

    if (!response.ok) {
      throw new Error("Failed to upload photo");
    }
  });

  return {
    uploadVideoMutation,
    uploadPhotoMutation,
  };
};

export default useUploadMedia;
