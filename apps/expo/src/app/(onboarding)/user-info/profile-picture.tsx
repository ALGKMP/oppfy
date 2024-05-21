import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import defaultProfilePicture from "@assets/default-profile-picture.png";
import { Avatar, Button, Spinner, Text, XStack, YStack } from "tamagui";

import { BaseScreenView, KeyboardSafeView } from "~/components/Views";
import { useUploadProfilePicture } from "~/hooks/media";

const ProfilePicture = () => {
  const router = useRouter();

  const { imageUri, pickAndUploadImage, uploadStatus } =
    useUploadProfilePicture({
      optimisticallyUpdate: true,
    });

  const onSubmit = () =>
    router.replace("/(app)/(bottom-tabs)/(self-profile)/media-of-you");

  const onSkip = () =>
    router.replace("/(app)/(bottom-tabs)/(self-profile)/media-of-you");

  return (
    <KeyboardSafeView>
      <BaseScreenView safeAreaEdges={["bottom"]}>
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            Upload your profile pic.
          </Text>

          <XStack height="70%" alignItems="center" gap="$2">
            <TouchableOpacity
              style={{ flex: 1, alignItems: "center" }}
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
          </XStack>
        </YStack>

        <Button
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
        </Button>
      </BaseScreenView>
    </KeyboardSafeView>
  );
};

export default ProfilePicture;
