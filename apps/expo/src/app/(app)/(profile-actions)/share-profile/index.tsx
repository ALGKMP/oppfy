import React from "react";
import { TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useToastController } from "@tamagui/toast";
import { H4, styled, Text, Theme, XStack, YStack } from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

import { api } from "~/utils/api";

const GRADIENT_COLORS = ["#fc00ff", "#9700ff"];

const ShareProfile = () => {
  const utils = api.useUtils();
  const toast = useToastController();

  const userId = utils.profile.getFullProfileSelf.getData()?.userId ?? "";
  const username = utils.profile.getFullProfileSelf.getData()?.username ?? "";
  const name = utils.profile.getFullProfileSelf.getData()?.name ?? "";
  const profilePictureUrl =
    utils.profile.getFullProfileSelf.getData()?.profilePictureUrl ?? "";

  const qrValue = new URL(
    // `/profile?username=${username}&userId=${userId}&name=${name}&profilePictureUrl=${profilePictureUrl}`,
    "https://www.oppfy.app",
  ).toString();

  const handleShare = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Sharing.shareAsync(qrValue);
  };

  const handleCopyLink = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Clipboard.setStringAsync(qrValue);
    toast.show("Link copied");
  };

  return (
    <LinearGradient flex={1} colors={GRADIENT_COLORS}>
      <YStack
        flex={1}
        padding="$6"
        alignItems="center"
        justifyContent="center"
        gap="$4"
      >
        <QRContainer paddingVertical="$8" width="100%">
          <YStack alignItems="center" gap="$4">
            <MaskedQRCode value={qrValue} />
            <GradientText>{username}</GradientText>
          </YStack>
        </QRContainer>
        <XStack width="100%" gap="$4">
          <ActionButton
            onPress={handleShare}
            icon="share-outline"
            text="Share profile"
          />
          <ActionButton
            onPress={handleCopyLink}
            icon="copy-outline"
            text="Copy Link"
          />
        </XStack>
      </YStack>
    </LinearGradient>
  );
};

const QRContainer = styled(YStack, {
  alignItems: "center",
  backgroundColor: "white",
  borderRadius: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 5,
  width: "100%",
});

interface GradientTextProps {
  children: React.ReactNode;
}

const GradientText = ({ children }: GradientTextProps) => {
  return (
    <MaskedView
      maskElement={
        <H4 color="black" fontFamily="$silkscreen" fontSize={24}>
          @{children}
        </H4>
      }
    >
      <LinearGradient colors={GRADIENT_COLORS}>
        <H4 color="transparent" fontFamily="$silkscreen" fontSize={24}>
          @{children}
        </H4>
      </LinearGradient>
    </MaskedView>
  );
};

interface MaskedQRCodeProps {
  value: string;
}

const MaskedQRCode = ({ value }: MaskedQRCodeProps) => {
  return (
    <MaskedView
      maskElement={
        <QRCode
          value={value}
          size={200}
          color="black"
          backgroundColor="transparent"
        />
      }
      style={{ height: 200, width: 200 }}
    >
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 200, width: 200 }}
      />
    </MaskedView>
  );
};

interface ActionButtonProps {
  onPress: () => void;
  icon: string;
  text: string;
}

const ActionButton = ({ onPress, icon, text }: ActionButtonProps) => (
  <Theme name="light">
    <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
      <YStack
        padding="$3"
        borderRadius="$6"
        alignItems="center"
        backgroundColor="white"
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.1}
        shadowRadius={8}
        elevation={2}
        gap="$2"
      >
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */}
        <Ionicons name={icon as any} size={28} />
        <Text>{text}</Text>
      </YStack>
    </TouchableOpacity>
  </Theme>
);

export default ShareProfile;
