import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import Feather from "@expo/vector-icons/Feather";
import { Paragraph, useTheme } from "tamagui";

import {
  H2,
  OnboardingButton,
  ScreenView,
  Spinner,
  View,
  YStack,
} from "~/components/ui";
import { useContacts } from "~/hooks/contacts";
import { useUploadProfilePicture } from "~/hooks/media";
import { api } from "~/utils/api";

const ProfilePicture = () => {
  const router = useRouter();
  const utils = api.useUtils();
  const theme = useTheme();

  const { syncContacts } = useContacts();

  const { imageUri, pickAndUploadImage, uploadStatus } =
    useUploadProfilePicture({
      optimisticallyUpdate: true,
    });

  const [hasUploadedPic, setHasUploadedPic] = React.useState(false);

  const handleImageUpload = async () => {
    const result = await pickAndUploadImage();
    if (result.success) setHasUploadedPic(true);
  };

  useEffect(() => {
    const fn = async () => {
      await syncContacts();
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
    <ScreenView
      paddingBottom={0}
      paddingTop="$10"
      justifyContent="space-between"
      keyboardAvoiding
      safeAreaEdges={["bottom"]}
    >
      <YStack alignItems="center" gap="$6">
        <H2 textAlign="center">Upload your{"\n"}profile pic!</H2>

        <YStack alignItems="center" gap="$3">
          <TouchableOpacity onPress={handleImageUpload}>
            <View position="relative">
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
              <View
                position="absolute"
                bottom={0}
                right={0}
                borderRadius={40}
                borderWidth="$2"
                borderColor={theme.background.val}
                backgroundColor="$gray5"
                padding="$2"
              >
                <Feather name="edit-3" size={24} color={theme.blue9.val} />
              </View>
            </View>
          </TouchableOpacity>
        </YStack>

        <Paragraph size="$5" color="$gray11" textAlign="center">
          {hasUploadedPic
            ? "You really understood the assignment with that pic!"
            : "Because a face like yours is hard to forget."}
        </Paragraph>
      </YStack>

      <OnboardingButton
        marginHorizontal="$-4"
        disabled={uploadStatus === "pending"}
        onPress={hasUploadedPic ? onSubmit : onSkip}
        {...(!hasUploadedPic ? { backgroundColor: "$gray7" } : {})}
      >
        {uploadStatus === "pending" ? (
          <Spinner />
        ) : hasUploadedPic ? (
          "Continue"
        ) : (
          "Skip"
        )}
      </OnboardingButton>
    </ScreenView>
  );
};

export default ProfilePicture;
