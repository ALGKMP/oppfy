import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
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
    const fn = async () => {
      await syncContacts();
      await utils.contacts.getRecommendationProfilesSelf.prefetch();
    };

    void fn();
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(app)/(bottom-tabs)/(home)");
  };

  const onSkip = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(app)/(bottom-tabs)/(home)");
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
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  borderColor: "#F214FF",
                  borderWidth: 2,
                }}
              />
            </TouchableOpacity>

            <DisclaimerText>
              Your profile picture helps people recognize you.
            </DisclaimerText>
          </YStack>

          <OnboardingButton
            disabled={uploadStatus === "pending"}
            onPress={imageUri ? onSubmit : onSkip}
          >
            {uploadStatus === "pending" ? (
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
