import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import defaultProfilePicture from "@assets/default-profile-picture.png";
import { Avatar, H1, Spinner, YStack } from "tamagui";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import {
  DisclaimerText,
  OnboardingButton,
} from "~/features/onboarding/components";
import { useUploadProfilePicture } from "~/hooks/media";

const ProfilePicture = () => {
  const router = useRouter();

  const { imageUri, pickAndUploadImage, uploadStatus } =
    useUploadProfilePicture({
      optimisticallyUpdate: true,
    });

  const onSubmit = () =>
    router.replace("/(app)/(bottom-tabs)/(profile)/self-profile/profile");

  const onSkip = () =>
    router.replace("/(app)/(bottom-tabs)/(profile)/self-profile/profile");

  return (
    <KeyboardSafeView>
      <BaseScreenView
        safeAreaEdges={["bottom"]}
        backgroundColor="$background"
        paddingBottom={0}
        paddingHorizontal={0}
      >
        <YStack flex={1} justifyContent="space-between">
          <YStack paddingHorizontal="$4" gap="$6">
            <H1 textAlign="center">Upload your profile pic.</H1>

            <TouchableOpacity
              style={{ alignItems: "center" }}
              onPress={pickAndUploadImage}
            >
              <Avatar circular size="$14" bordered>
                <Avatar.Image
                  {...(imageUri
                    ? { src: imageUri }
                    : { source: defaultProfilePicture })}
                />
                <Avatar.Fallback />
              </Avatar>
            </TouchableOpacity>

            <DisclaimerText>
              Your profile picture helps people recognize you.
            </DisclaimerText>
          </YStack>

          <OnboardingButton
            disabled={uploadStatus === "loading"}
            onPress={imageUri ? onSubmit : onSkip}
          >
            {uploadStatus === "loading" ? (
              <Spinner />
            ) : imageUri ? (
              "Continue"
            ) : (
              "Skip"
            )}
          </OnboardingButton>
        </YStack>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default ProfilePicture;
