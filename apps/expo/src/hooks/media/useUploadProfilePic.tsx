import { useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";

import { api } from "~/utils/api";

interface UseUploadProfilePicInput {
  optimisticallyUpdate: boolean;
}

interface PutToPresignedUrlInput {
  presignedUrl: string;
  body?: BodyInit | null | undefined;
}

const useUploadProfilePic = ({
  optimisticallyUpdate,
}: UseUploadProfilePicInput) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const utils = api.useUtils();

  const createPresignedUrlForProfilePicture =
    api.profile.createPresignedUrlForProfilePicture.useMutation();

  const putToPresignedUrl = useMutation(
    async ({ presignedUrl, body }: PutToPresignedUrlInput) => {
      const response = await fetch(presignedUrl, {
        method: "PUT",
        body,
      });

      if (!response.ok) {
        throw new Error("Failed to upload profile picture");
      }
    },
    // {
    //   onMutate: async (newProfilePictureUrl) => {
    //     if (!optimisticallyUpdate) return;

    //     // Cancel outgoing fetches (so they don't overwrite our optimistic update)
    //     await utils.profile.getFullProfile.cancel();

    //     // Get the data from the queryCache
    //     const prevData = utils.profile.getFullProfile.getData();
    //     if (prevData === undefined) return;

    //     // Optimistically update the data
    //     utils.profile.getFullProfile.setData(
    //       { userId: "OZK0Mq45uIY75FaZdI2OdUkg5Cx1" },
    //       {
    //         ...prevData,
    //         profilePictureUrl: newProfilePictureUrl,
    //       },
    //     );

    //     // Return the previous data so we can revert if something goes wrong
    //     return { prevData };
    //   },
    //   onError: (_err, _newProfilePictureUrl, ctx) => {
    //     if (!optimisticallyUpdate) return;
    //     if (ctx === undefined) return;

    //     // If the mutation fails, use the context-value from onMutate
    //     utils.profile.getFullProfile.setData(
    //       { userId: "OZK0Mq45uIY75FaZdI2OdUkg5Cx1" },
    //       ctx.prevData,
    //     );
    //   },
    //   onSettled: async () => {
    //     if (!optimisticallyUpdate) return;

    //     // Sync with server once mutation has settled
    //     await utils.profile.getFullProfile.invalidate();
    //   },
    // },
  );

  const pickAndUploadImage = async () => {
    // Let the user pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    // Reduce image resolution
    const { uri } = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [
        {
          resize: {
            width: 500,
            height: 500,
          },
        },
      ],
      { format: ImageManipulator.SaveFormat.JPEG },
    );

    setImageUri(uri);

    const presignedUrl =
      await createPresignedUrlForProfilePicture.mutateAsync();

    const profilePictureResponse = await fetch(uri);
    const profilePictureBlob = await profilePictureResponse.blob();

    await putToPresignedUrl.mutateAsync({
      presignedUrl,
      body: profilePictureBlob,
    });
  };

  return {
    imageUri,
    pickAndUploadImage,
    uploadStatus: putToPresignedUrl.status,
    error: putToPresignedUrl.error,
  };
};

export default useUploadProfilePic;
