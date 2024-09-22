import { useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";

import { api } from "~/utils/api";

interface UseUploadProfilePictureInput {
  optimisticallyUpdate: boolean;
}

const useUploadProfilePicture = ({
  optimisticallyUpdate,
}: UseUploadProfilePictureInput) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const utils = api.useUtils();

  const generatePresignedUrlForProfilePicture =
    api.profile.generatePresignedUrlForProfilePicture.useMutation();

  const getMediaBlob = async (uri: string) => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const uploadProfilePicture = useMutation(
    async (uri: string) => {
      const profilePictureBlob = await getMediaBlob(uri);

      const presignedUrl =
        await generatePresignedUrlForProfilePicture.mutateAsync({
          contentLength: profilePictureBlob.size,
        });

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: profilePictureBlob,
      });

      if (!response.ok) {
        throw new Error("Failed to upload profile picture");
      }
    },
    {
      onMutate: async (newProfilePictureUrl) => {
        if (!optimisticallyUpdate) return;

        // Cancel outgoing fetches (so they don't overwrite our optimistic update)
        await utils.profile.getFullProfileSelf.cancel();

        // Get the data from the queryCache
        const prevData = utils.profile.getFullProfileSelf.getData();
        if (prevData === undefined) return;

        // Optimistically update the data
        utils.profile.getFullProfileSelf.setData(undefined, {
          ...prevData,
          profilePictureUrl: newProfilePictureUrl,
        });

        // Return the previous data so we can revert if something goes wrong
        return { prevData };
      },
      onError: (_err, _newProfilePictureUrl, ctx) => {
        if (!optimisticallyUpdate) return;
        if (ctx === undefined) return;

        // If the mutation fails, use the context-value from onMutate
        utils.profile.getFullProfileSelf.setData(undefined, ctx.prevData);
      },
      onSettled: () => {
        if (!optimisticallyUpdate) return;
        // Sync with server once mutation has settled
        setTimeout(
          () => void utils.profile.getFullProfileSelf.invalidate(),
          10000,
        );
        // await utils.profile.getFullProfileSelf.invalidate();
      },
    },
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
      undefined,
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
    );

    setImageUri(uri);

    await uploadProfilePicture.mutateAsync(uri);
  };

  return {
    imageUri,
    pickAndUploadImage,
    uploadStatus: uploadProfilePicture.status,
    error: uploadProfilePicture.error,
  };
};

export default useUploadProfilePicture;
