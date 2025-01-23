import React from "react";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useToastController } from "@tamagui/toast";
import { Stack, Text, useTheme, View, YStack } from "tamagui";

import BeautifulQRCode from "~/components/QRCode/BeautifulQRCode";
import { Avatar, Button, H1 } from "~/components/ui";
import { api } from "~/utils/api";

const ShareProfile = () => {
  const theme = useTheme();
  const utils = api.useUtils();
  const toast = useToastController();

  const username = utils.profile.getFullProfileSelf.getData()?.username ?? "";
  const profilePictureUrl =
    utils.profile.getFullProfileSelf.getData()?.profilePictureUrl ?? "";
  const profileUrl = `https://www.oppfy.app/profile/${username}`;

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Sharing.shareAsync(profileUrl);
  };

  const handleCopyLink = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(profileUrl);
    toast.show("Link copied to clipboard");
  };

  return (
    <Stack f={1}>
      <LinearGradient
        colors={["#F214FF", "#FF14D4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill}>
        <YStack f={1} p="$6" jc="space-between">
          <YStack f={1} ai="center" jc="center" gap="$6">
            {/* Profile Card */}
            <View
              width={340}
              // height={420}
              br={44}
              ov="hidden"
              bg="rgba(255,255,255,0.1)"
              ai="center"
              jc="center"
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 20 }}
              shadowOpacity={0.2}
              shadowRadius={40}
            >
              {/* Background Layer */}
              {profilePictureUrl && (
                <Image
                  source={profilePictureUrl}
                  style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}
                  contentFit="cover"
                />
              )}
              <BlurView
                intensity={80}
                tint="light"
                style={StyleSheet.absoluteFill}
              />

              {/* Content Container */}
              <YStack ai="center" gap="$4" py="$6">
                {/* QR Code Container */}
                <View
                  mt="$4"
                  width={270}
                  height={270}
                  br={36}
                  bg="white"
                  ai="center"
                  jc="center"
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 8 }}
                  shadowOpacity={0.1}
                  shadowRadius={24}
                >
                  <BeautifulQRCode
                    value={profileUrl}
                    size={230}
                    profilePictureUrl={profilePictureUrl}
                  />
                </View>

                {/* Username */}
                <H1
                  size="$9"
                  fontFamily="$body"
                  shadowColor="rgba(0,0,0,0.2)"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowRadius={4}
                >
                  @{username}
                </H1>
              </YStack>

              {/* Decorative Elements */}
              <View
                position="absolute"
                width={120}
                height={120}
                br={60}
                top={-40}
                right={-40}
                bg="rgba(242,20,255,0.15)"
              />
              <View
                position="absolute"
                width={100}
                height={100}
                br={50}
                bottom={-30}
                left={-30}
                bg="rgba(242,20,255,0.15)"
              />
            </View>
          </YStack>

          <YStack gap="$4" mb="$4">
            <Button
              size="$6"
              variant="white"
              icon={
                <Ionicons
                  name="share-outline"
                  size={24}
                  color={theme.primary.val as string}
                />
              }
              onPress={handleShare}
            >
              Share Profile
            </Button>

            <Button
              size="$6"
              variant="white"
              icon={
                <Ionicons
                  name="copy-outline"
                  size={24}
                  color={theme.primary.val as string}
                />
              }
              onPress={handleCopyLink}
            >
              Copy Link
            </Button>
          </YStack>
        </YStack>
      </BlurView>
    </Stack>
  );
};

export default ShareProfile;
