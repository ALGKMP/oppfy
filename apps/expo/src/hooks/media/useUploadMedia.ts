import { useMutation } from "@tanstack/react-query";

import { validators } from "@oppfy/validators";

import { api } from "~/utils/api";

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
    api.post.createVideoPresignedUrlForUserOnApp.useMutation();
  const createVideoPresignedUrlForUserNotOnApp =
    api.post.createVideoPresignedUrlForUserNotOnApp.useMutation();
  const createImagePresignedUrlForUserOnApp =
    api.post.createImagePresignedUrlForUserOnApp.useMutation();
  const createImagePresignedUrlForUserNotOnApp =
    api.post.createImagePresignedUrlForUserNotOnApp.useMutation();

  const getMediaBlob = async (uri: string) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const uploadVideoMutation = useMutation({
    mutationFn: async (input: UploadMediaInput) => {
      const { uri, caption, width, height } = input;

      const videoBlob = await getMediaBlob(uri);

      const baseData = {
        caption,
        width: width.toString(),
        height: height.toString(),
      };

      const { presignedUrl, postId } =
        input.type === "onApp"
          ? await createVideoPresignedUrlForUserOnApp.mutateAsync({
              ...baseData,
              recipient: input.recipient,
            })
          : await createVideoPresignedUrlForUserNotOnApp.mutateAsync({
              ...baseData,
              number: input.number,
              name: input.name,
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

      const photoBlob = await getMediaBlob(uri);

      const parsedMediaType = validators.postContentType.safeParse(
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

      const { presignedUrl, postId } =
        input.type === "onApp"
          ? await createImagePresignedUrlForUserOnApp.mutateAsync({
              ...baseData,
              recipient: input.recipient,
            })
          : await createImagePresignedUrlForUserNotOnApp.mutateAsync({
              ...baseData,
              number: input.number,
              name: input.name,
            });

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: photoBlob,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      return postId;
    },
  });

  return {
    uploadVideoMutation,
    uploadPhotoMutation,
  };
};

export default useUploadMedia;
