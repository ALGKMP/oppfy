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
  const uploadVideoPostForUserOnApp =
    api.post.uploadVideoPostForUserOnApp.useMutation();
  const uploadVideoPostForUserNotOnApp =
    api.post.uploadVideoPostForUserNotOnApp.useMutation();
  const uploadPicturePostForUserOnApp =
    api.post.uploadPicturePostForUserOnApp.useMutation();
  const uploadPicturePostForUserNotOnApp =
    api.post.uploadPicturePostForUserNotOnApp.useMutation();

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
        ? await uploadVideoPostForUserOnApp.mutateAsync({
            ...baseData,
            recipient: input.recipient,
          })
        : await uploadVideoPostForUserNotOnApp.mutateAsync({
            ...baseData,
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
        ? await uploadPicturePostForUserOnApp.mutateAsync({
            ...baseData,
            recipient: input.recipient,
          })
        : await uploadPicturePostForUserNotOnApp.mutateAsync({
            ...baseData,
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
