import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import defaultProfilePicture from "@assets/default-profile-picture.png";
import { Avatar, Button, Text, View, XStack, YStack } from "tamagui";

import { KeyboardSafeView } from "~/components/SafeViews";

const ProfilePicture = () => {
  const router = useRouter();

  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // TODO: Implement photo upload to S3

  const onSubmit = () => {
    router.replace("/(app)/(bottom-tabs)/profile");
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
      const { uri } = result.assets[0];

      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [], // No operations needed, just format conversion
        { format: ImageManipulator.SaveFormat.PNG },
      );

      setProfilePicture(result.assets[0]?.uri ?? null);
    }
  };

  return (
    <KeyboardSafeView>
      <View flex={1} padding="$4" backgroundColor="$background">
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
      </View>
    </KeyboardSafeView>
  );
};

export default ProfilePicture;
