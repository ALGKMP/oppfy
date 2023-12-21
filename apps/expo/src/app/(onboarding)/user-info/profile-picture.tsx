import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
import { Button, Text, View, YStack } from "tamagui";

import { api } from "~/utils/api";

const ProfilePicture: React.FC = () => {
  const router = useRouter();

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const updateUserDetails = api.auth.updateUserDetails.useMutation();

  // TODO: Implement S3 bucket upload
  const onSubmit = async () => {
    // await updateUserDetails.mutateAsync({
    //   profilePic,
    // });
    // router.replace("/(app)/(bottom-tabs)/profile");
  };

  const onSkip = () => router.replace("/(app)/(bottom-tabs)/profile");

  const handleImagePicking = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePic(result.assets[0].uri);
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

          <YStack space="$3" alignItems="center">
            {profilePic && (
              <Image
                source={{ uri: profilePic } as ImageSourcePropType}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            )}
            <Button onPress={handleImagePicking}>Choose Image</Button>
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
