import { useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";

import { api } from "~/utils/api";

interface UseUploadProfilePictureInput {
  optimisticallyUpdate?: boolean;
}

const useUploadProfilePicture = ({
  optimisticallyUpdate = true,
}: UseUploadProfilePictureInput = {}) => {
  const utils = api.useUtils();

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const generateProfilePicturePresignedUrl =
    api.profile.generateProfilePicturePresignedUrl.useMutation();

  // Pick image mutation
  const pickImage = useMutation({
    mutationFn: async () => {
      // Let user pick an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) {
        throw new Error("Image selection cancelled");
      }

      // Reduce image resolution
      const { uri } = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        undefined,
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG },
      );

      return uri;
    },
    onSuccess: (uri) => {
      setSelectedImageUri(uri);
    },
  });

  // Upload image mutation
  const uploadImage = useMutation({
    mutationFn: async (uri: string) => {
      const profilePictureBlob = await fetch(uri).then((r) => r.blob());

      const presignedUrl = await generateProfilePicturePresignedUrl.mutateAsync(
        {
          contentLength: profilePictureBlob.size,
        },
      );

      if (!presignedUrl) {
        throw new Error("Failed to generate presigned url");
      }

      const response = await fetch(presignedUrl, {
        method: "PUT",
        body: profilePictureBlob,
      });

      if (!response.ok) {
        throw new Error("Failed to upload profile picture");
      }

      return uri;
    },
    onMutate: async (newProfilePictureUrl: string) => {
      if (!optimisticallyUpdate) return;

      // Cancel outgoing fetches
      await utils.profile.getProfile.cancel({});

      // Get current data
      const prevData = utils.profile.getProfile.getData({});
      if (prevData === undefined) return;

      // Optimistically update
      utils.profile.getProfile.setData(
        {},
        {
          ...prevData,
          profilePictureUrl: newProfilePictureUrl,
        },
      );

      return { prevData };
    },
    onError: (_err, _newUrl, ctx) => {
      if (!optimisticallyUpdate) return;
      if (ctx === undefined) return;

      // Revert optimistic update on error
      utils.profile.getProfile.setData({}, ctx.prevData);
    },
  });

  return {
    // State
    selectedImageUri,

    // Actions
    pickImage: () => pickImage.mutateAsync(),
    uploadImage: (uri: string) => uploadImage.mutateAsync(uri),

    // Status
    isPickerLoading: pickImage.isPending,
    isUploading: uploadImage.isPending,

    // Errors
    pickError: pickImage.error,
    uploadError: uploadImage.error,

    // Reset
    reset: () => {
      setSelectedImageUri(null);
      pickImage.reset();
      uploadImage.reset();
    },
  };
};

export default useUploadProfilePicture;
