import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { H4, styled, Text, Theme, XStack, YStack } from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

import { api } from "~/utils/api";

const ShareProfile = () => {
  const utils = api.useUtils();
  const [username, setUsername] = useState<string | undefined>();
  const [qrValue, setQrValue] = useState<string>("");
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchedUsername =
      utils.profile.getFullProfileSelf.getData()?.username;
    setUsername(fetchedUsername);
    if (fetchedUsername) {
      setQrValue(`https://yourapp.com/profile/${fetchedUsername}`);
    }

    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();
  }, [utils.profile.getFullProfileSelf]);

  const handleShare = async () => {
    if (qrValue) {
      try {
        await Sharing.shareAsync(qrValue);
      } catch (error) {
        console.error("Error sharing profile:", error);
      }
    }
  };

  const handleCopyLink = async () => {
    if (qrValue) {
      await Clipboard.setStringAsync(qrValue);
      console.log("Link copied to clipboard");
    }
  };

  const gradientColors = [
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#38f9d7",
    "#4facfe",
    "#00f2fe",
  ];

  const animatedColors = gradientColors.map((color, index) => {
    return animation.interpolate({
      inputRange: [
        index / (gradientColors.length - 1),
        (index + 1) / (gradientColors.length - 1),
      ],
      outputRange: [
        color,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        gradientColors[(index + 1) % gradientColors.length]!,
      ],
      extrapolate: "clamp",
    });
  });

  return (
    <AnimatedGradient
      flex={1}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      colors={animatedColors}
    >
      <YStack
        flex={1}
        padding="$6"
        alignItems="center"
        justifyContent="center"
        gap="$4"
      >
        <QRContainer width="100%">
          <YStack padding="$8" alignItems="center" gap="$4">
            <QRCode
              value={qrValue || "https://yourapp.com"}
              size={200}
              color="#3b82f6"
              backgroundColor="transparent"
              logoBackgroundColor="white"
            />
            <GradientText>{username?.toUpperCase()}</GradientText>
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
    </AnimatedGradient>
  );
};

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const QRContainer = styled(YStack, {
  alignItems: "center",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  borderRadius: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 5,
  width: "100%",
});

const GradientText: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <MaskedView
      maskElement={
        <H4 color="black" fontSize={24} fontWeight="bold">
          @{children}
        </H4>
      }
    >
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <H4 color="transparent" fontSize={24} fontWeight="bold">
          @{children}
        </H4>
      </LinearGradient>
    </MaskedView>
  );
};

interface ActionButtonProps {
  onPress: () => void;
  icon: string;
  text: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onPress, icon, text }) => (
  <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
    <YStack
      padding="$4"
      borderRadius="$6"
      alignItems="center"
      backgroundColor="rgba(255, 255, 255, 0.8)"
      style={
        {
          shadowColor: "rgba(0, 0, 0, 0.1)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 2,
        } as ViewStyle
      }
    >
      <Ionicons name={icon as any} size={32} color="#3b82f6" />
      <Text color="#3b82f6" fontSize={16} fontWeight="bold" marginTop="$2">
        {text}
      </Text>
    </YStack>
  </TouchableOpacity>
);

export default ShareProfile;
