import { useMutation } from "@tanstack/react-query";

import { sharedValidators } from "@oppfy/validators";

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

  const uploadVideoMutation = useMutation({
    mutationFn: async (input: UploadMediaInput) => {
      const { uri, caption, width, height } = input;

      const videoBlob = await getMediaBlob(uri);

      const baseData = {
        caption,
        width: width.toString(),
        height: height.toString(),
      };

      console.log("input", input);

      const { url, postId } =
        input.type === "onApp"
          ? await uploadVideoPostForUserOnApp.mutateAsync({
              ...baseData,
              recipient: input.recipient,
            })
          : await uploadVideoPostForUserNotOnApp.mutateAsync({
              ...baseData,
              number: input.number,
              name: input.name,
            });

      const response = await fetch(url, {
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

      const { url, postId } =
        input.type === "onApp"
          ? await uploadPicturePostForUserOnApp.mutateAsync({
              ...baseData,
              recipient: input.recipient,
            })
          : await uploadPicturePostForUserNotOnApp.mutateAsync({
              ...baseData,
              number: input.number,
              name: input.name,
            });

      console.log("url", url);
      console.log("postId", postId);

      const response = await fetch(url, {
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
