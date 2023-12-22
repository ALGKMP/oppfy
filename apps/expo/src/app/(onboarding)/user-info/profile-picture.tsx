import React, { useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { Image, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
import defaultProfilePic from "@assets/default-profile-pic.png";
import { Plus } from "@tamagui/lucide-icons";
import { Button, Circle, Text, View, XStack, YStack } from "tamagui";

import { api } from "~/utils/api";

const ProfilePicture: React.FC = () => {
  const router = useRouter();

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const updateUserDetails = api.auth.updateUserDetails.useMutation();

  // TODO: Implement S3 bucket upload - @TONY
  const onSubmit = async () => {
    // await updateUserDetails.mutateAsync({
    //   profilePic,
    // });
    router.replace("/(app)/(bottom-tabs)/profile");
  };

  const onSkip = () => router.replace("/(app)/(bottom-tabs)/profile");

  const handleImagePicking = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0]?.uri ?? null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View
        flex={1}
        backgroundColor="black"
        padding="$6"
        justifyContent="space-between"
      >
        <YStack flex={1} space="$8" alignItems="center">
          <Text
            alignSelf="center"
            textAlign="center"
            fontSize={22}
            fontWeight="900"
          >
            Upload Your Profile Picture
          </Text>

          <YStack
            ai="center"
            jc="center"
            position="relative"
            onPress={handleImagePicking}
          >
            {profilePic ? (
              <Image
                source={{ uri: profilePic } as ImageSourcePropType}
                style={{ width: 200, height: 200, borderRadius: 100 }}
              />
            ) : (
              <Image
                style={{ width: 200, height: 200, borderRadius: 100 }}
                source={defaultProfilePic}
              />
            )}

            <XStack
              position="absolute"
              bottom={-2}
              right={-2}
              ai="center"
              jc="center"
            >
              <Circle
                size="$6"
                backgroundColor="black"
                borderWidth={2}
                borderColor="white"
              >
                <XStack ai="center" jc="center">
                  <Plus size="$3" />
                </XStack>
              </Circle>
            </XStack>
          </YStack>
        </YStack>

        <Button
          onPress={profilePic ? onSubmit : onSkip}
          borderWidth={0}
          pressStyle={{ backgroundColor: profilePic ? "$gray12" : "$gray9" }}
          backgroundColor={profilePic ? "white" : "gray"}
        >
          <Text
            color={profilePic ? "black" : "lightgray"}
            fontWeight="600"
            fontSize={16}
          >
            {profilePic ? "Next" : "Skip"}
          </Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ProfilePicture;
