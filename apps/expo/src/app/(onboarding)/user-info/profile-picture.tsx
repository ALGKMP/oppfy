import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import defaultProfilePicture from "@assets/default-profile-picture.png";
import { Avatar, Button, Text, View, XStack, YStack } from "tamagui";
import { useMutation } from "@tanstack/react-query";
import { api } from "~/utils/api";

import { KeyboardSafeView } from "~/components/SafeViews";
import { ScreenBaseView } from "~/components/Views";

const ProfilePicture = () => {
  const router = useRouter();

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [type, setType] = useState<string | null>(null);

  const pfpMutation = api.profile.createPresignedUrlForProfilePicture.useMutation();

  const putMutation = useMutation(async (url: string) => {
    if (!profilePicture) {
      console.log("blyat wtf")
      return;
    }

    const response = await fetch(url, {
      method: "PUT",
      body: await (await fetch(profilePicture)).blob(),
    });
    console.log("hitting presigned: ", response.status);

    if (!response.ok) {
      console.log(response);
      return;
    }

    console.log("status: ", response.status);
  });

  // TODO: Implement photo upload to S3

  const onSubmit = async () => {
    if (!size || !type) {
      console.log("Error: Size or type of the image is missing");
      return;
    }
  
    console.log("Submitting mutation with size:", size, "and type:", type);
    try {
      await pfpMutation.mutateAsync(
        { contentLength: size, contentType: type },
        {
          onSuccess: (url) => {
            console.log("Mutation successful, URL received:", url);
            putMutation.mutate(url, {
              onSuccess: () => {
                console.log("Image successfully uploaded");
                router.replace("/(app)/(bottom-tabs)/profile");
              },
              onError: (error) => {
                console.error("Error uploading image:", error);
              }
            });
          },
          onError: (error) => {
            console.error("Error during presigned URL mutation:", error);
          }
        }
      );
    } catch (error) {
      console.error("Unexpected error during mutation:", error);
    }
  };
  
  const onSkip = () => {
    router.replace("/(app)/(bottom-tabs)/profile");
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
        undefined, // No operations needed, just format conversion
        { format: ImageManipulator.SaveFormat.JPEG },
      );

      if (result.assets[0]?.uri && result.assets[0]?.mimeType) {
        setType(result.assets[0].mimeType);
        setSize(await (await fetch(uri)).blob().then((blob) => blob.size));
        setProfilePicture(uri);
      } else {
        console.log("ffs missing size and type")
      }
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
