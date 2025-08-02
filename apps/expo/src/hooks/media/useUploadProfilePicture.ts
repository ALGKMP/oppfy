import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";

import { api } from "~/utils/api";
import {
  calculateCompressionSavings,
  compressImage,
  formatFileSize,
  isCompressionBeneficial,
} from "~/utils/imageCompression";

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

      const selectedAsset = result.assets[0];

      // Get original file size for comparison
      const originalResponse = await fetch(selectedAsset.uri);
      const originalBlob = await originalResponse.blob();
      const originalSize = originalBlob.size;

      console.log(
        `👤 Original profile picture: ${selectedAsset.width}x${selectedAsset.height}, ${formatFileSize(originalSize)}`,
      );

      // Compress the image with profile picture specific settings
      const compressedImage = await compressImage(
        selectedAsset.uri,
        "profilePicture",
      );

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
        `🗜️  Compressed profile picture: ${compressedImage.width}x${compressedImage.height}, ${formatFileSize(compressedImage.size)}`,
      );
      console.log(
        `💾 Profile picture compression saved ${formatFileSize(savings.savedBytes)} (${savings.savedPercentage}%) - ${beneficial ? "✅ Beneficial" : "⚠️ Minimal benefit"}`,
      );

      return compressedImage.uri;
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
