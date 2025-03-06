import React from "react";
import BaseQRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { View } from "tamagui";

interface QRCodeProps {
  value: string;
  size?: number;
  profilePictureUrl?: string | null;
}

export const QRCode = ({
  value,
  size = 230,
  profilePictureUrl,
}: QRCodeProps) => {
  const qrSize = Math.floor(size * 0.8);
  const logoSize = Math.floor(qrSize * 0.28); // Logo takes up 28% of QR code

  return (
    <View style={{ width: size, height: size, padding: 16 }}>
      <LinearGradient
        colors={["rgba(242,20,255,0.1)", "rgba(255,20,212,0.1)"]}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          bottom: 16,
          borderRadius: 20,
        }}
      />
      <View flex={1} ai="center" jc="center">
        <View bg="$primary" br={36} p="$4">
          <View bg="white" br={36} p="$4">
            <BaseQRCode
              value={value}
              size={qrSize}
              color="#F214FF"
              backgroundColor="white"
              quietZone={8}
              enableLinearGradient
              linearGradient={["#F214FF", "#FF14D4"]}
              gradientDirection={["0", "1", "1", "0"]}
              logo={
                profilePictureUrl
                  ? { uri: profilePictureUrl }
                  : DefaultProfilePicture
              }
              logoSize={logoSize}
              logoBackgroundColor="white"
              logoBorderRadius={logoSize / 2}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
