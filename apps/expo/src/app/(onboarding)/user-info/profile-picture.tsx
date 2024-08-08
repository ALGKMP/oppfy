import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { H1, Spinner, YStack } from "tamagui";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import {
  DisclaimerText,
  OnboardingButton,
} from "~/features/onboarding/components";
import { useContacts } from "~/hooks/contacts";
import { useUploadProfilePicture } from "~/hooks/media";
import { api } from "~/utils/api";

const ProfilePicture = () => {
  const router = useRouter();
  const utils = api.useUtils();

  const { syncContacts } = useContacts();

  const { imageUri, pickAndUploadImage, uploadStatus } =
    useUploadProfilePicture({
      optimisticallyUpdate: true,
    });

  useEffect(() => {
    void syncContacts().then(() => {
      utils.contacts.getRecommendationProfilesSelf.prefetch();
    });
  }, []);

  // const onSubmit = () => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  //   router.replace("misc/recomendations");
  // };
  // const onSkip = () => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  //   router.replace("misc/recomendations");
  // };

  const onSubmit = () => {
    utils.user.onboardingComplete.refetch();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(app)/(bottom-tabs)/(profile)/self-profile");
  };

  const onSkip = () => {
    utils.user.onboardingComplete.refetch();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(app)/(bottom-tabs)/(profile)/self-profile");
  };

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
              <Image
                source={imageUri ?? DefaultProfilePicture}
                style={{ width: 200, height: 200, borderRadius: 100 }}
              />
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
