import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { Button, Text, XStack, YStack } from "tamagui";

import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const ShareProfile: React.FC = () => {
  const utils = api.useUtils();
  const [username, setUsername] = useState<string | undefined>();
  const [qrValue, setQrValue] = useState<string>("");

  useEffect(() => {
    const fetchedUsername =
      utils.profile.getFullProfileSelf.getData()?.username;
    setUsername(fetchedUsername);
    if (fetchedUsername) {
      setQrValue(`https://yourapp.com/profile/${fetchedUsername}`);
    }
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

  const handleDownload = () => {
    console.log("Download QR code functionality to be implemented");
  };

  return (
    <LinearGradient colors={["#6A5ACD", "#9370DB"]} style={styles.background}>
      <YStack flex={1} alignItems="center" justifyContent="center" space="$4">
        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue || "https://yourapp.com"}
            size={250}
            color="black"
            backgroundColor="white"
          />
        </View>
        <Text style={styles.username}>@{username}</Text>
        <XStack space="$2" width="100%" paddingHorizontal="$4">
          <Button
            flex={1}
            icon={<Ionicons name="share-outline" size={20} color="white" />}
            onPress={handleShare}
            style={styles.button}
          >
            Share profile
          </Button>
          <Button
            flex={1}
            icon={<Ionicons name="link-outline" size={20} color="white" />}
            onPress={handleCopyLink}
            style={styles.button}
          >
            Copy link
          </Button>
          <Button
            flex={1}
            icon={<Ionicons name="download-outline" size={20} color="white" />}
            onPress={handleDownload}
            style={styles.button}
          >
            Download
          </Button>
        </XStack>
      </YStack>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
  },
  username: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingVertical: 12,
  },
});

export default ShareProfile;
