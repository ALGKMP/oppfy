import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import defaultProfilePicture from "@assets/default-profile-picture.png";
import { useMutation } from "@tanstack/react-query";
import { Avatar, Button, Text, View, XStack, YStack } from "tamagui";

import { KeyboardSafeView } from "~/components/SafeViews";
import { ScreenBaseView } from "~/components/Views";
import { api } from "~/utils/api";

interface PutToPresignedUrlInput {
  presignedUrl: string;
  body?: BodyInit | null | undefined;
}

const ProfilePicture = () => {
  const router = useRouter();

  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const createPresignedUrlForProfilePicture =
    api.profile.createPresignedUrlForProfilePicture.useMutation();

  const putToPresignedUrl = useMutation(
    async ({ presignedUrl, body }: PutToPresignedUrlInput) => {
      const response = await fetch(presignedUrl, {
        method: "PUT",
        body,
      });

      if (!response.ok) {
        console.error("Failed to upload profile picture", response);
        return;
      }
    },
  );

  const onSubmit = async () => {
    const presignedUrl =
      await createPresignedUrlForProfilePicture.mutateAsync();

    const profilePictureResponse = await fetch(profilePicture);
    const blob = await profilePictureResponse.blob();

    await putToPresignedUrl.mutateAsync({
      presignedUrl,
      body: blob,
    });

    router.replace("/(app)/(bottom-tabs)/(profile)/media-of-you");
  };

  const onSkip = () => {
    router.replace("/(app)/(bottom-tabs)/(profile)/media-of-you");
  };

  const handleImagePicking = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const { uri } = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        undefined,
        { format: ImageManipulator.SaveFormat.JPEG },
      );

      setProfilePicture(uri);
    }
  };

  return (
    <KeyboardSafeView>
      <ScreenBaseView>
        <YStack flex={1} gap="$4">
          <Text fontSize="$8" fontWeight="bold">
            Upload your profile pic.
          </Text>

          <XStack height="70%" alignItems="center" gap="$2">
            <TouchableOpacity
              style={{ flex: 1, alignItems: "center" }}
              onPress={handleImagePicking}
            >
              <Avatar circular size="$14">
                <Avatar.Image
                  {...(profilePicture
                    ? { src: profilePicture }
                    : { source: defaultProfilePicture })}
                />
                <Avatar.Fallback backgroundColor="$blue10" />
              </Avatar>
            </TouchableOpacity>
          </XStack>
        </YStack>

        <Button onPress={profilePicture ? onSubmit : onSkip}>
          {profilePicture ? "Continue" : "Skip"}
        </Button>
      </ScreenBaseView>
    </KeyboardSafeView>
  );
};

export default ProfilePicture;
