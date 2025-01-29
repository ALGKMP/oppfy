import React, { useState } from "react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";

import {
  OnboardingButton,
  OnboardingProfilePicture,
  OnboardingScreen,
} from "~/components/ui/Onboarding";
import { useUploadProfilePicture } from "~/hooks/media";
import { api, isTRPCClientError } from "~/utils/api";

enum Error {
  UNKNOWN = "Something went wrong. Please try again.",
}

export default function ProfilePicture() {
  const router = useRouter();
  const completedOnboarding = api.user.completedOnboarding.useMutation();
  const [error, setError] = useState<Error | null>(null);

  const {
    selectedImageUri,
    pickImage,
    uploadImage,
    isPickerLoading,
    isUploading,
  } = useUploadProfilePicture();

  const handleImagePick = async () => {
    try {
      await pickImage();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImageUri) {
      // Skip flow
      try {
        await completedOnboarding.mutateAsync();
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        router.replace("/tutorial/intro");
      } catch (err) {
        setError(Error.UNKNOWN);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Upload flow
    try {
      await uploadImage(selectedImageUri);
      await completedOnboarding.mutateAsync();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/tutorial/intro");
    } catch (err) {
      if (isTRPCClientError(err)) {
        switch (err.data?.code) {
          default:
            setError(Error.UNKNOWN);
            break;
        }
      } else {
        setError(Error.UNKNOWN);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <OnboardingScreen
      subtitle="One last thing"
      title="Show us a beautiful face"
      error={error}
      successMessage={
        selectedImageUri ? "Looking good! You're ready to go." : undefined
      }
      footer={
        <OnboardingButton
          onPress={handleSubmit}
          disabled={isPickerLoading || isUploading}
          isLoading={isUploading}
          isValid={selectedImageUri !== null}
          text={selectedImageUri ? "Continue" : "Skip for now"}
        />
      }
    >
      <OnboardingProfilePicture
        imageUri={selectedImageUri}
        defaultImage={DefaultProfilePicture}
        onPress={handleImagePick}
      />
    </OnboardingScreen>
  );
}
