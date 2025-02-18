import { useState } from "react";
import { Alert, Platform, Share } from "react-native";
import * as Linking from "expo-linking";
import { useTheme } from "tamagui";

interface SharePostToNewUserOptions {
  postId: string;
  phoneNumber: string;
}

const useShare = () => {
  const theme = useTheme();
  const [isSharing, setIsSharing] = useState(false);

  const sharePost = async (postId: string) => {
    setIsSharing(true);
    try {
      const url = `https://oppfy.app/post/${postId}`;

      await Share.share(
        {
          url, // This enables proper URL preview on iOS
        },
        {
          dialogTitle: "Share Post",
          subject: "Check out this post on Oppfy", // Used for email sharing
          tintColor: theme.primary.val as string, // Matches Oppfy brand color
        },
      );
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("An error occurred while sharing");
    }
    setIsSharing(false);
  };

  const shareProfile = async (username: string) => {
    setIsSharing(true);
    try {
      const url = `https://oppfy.app/profile/${username}`;
      await Share.share(
        {
          url,
        },
        {
          dialogTitle: "Share Profile",
          tintColor: theme.primary.val as string,
        },
      );
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("An error occurred while sharing");
    }
    setIsSharing(false);
  };

  const sharePostToNewUser = async ({
    postId,
    phoneNumber,
  }: SharePostToNewUserOptions) => {
    const message = `https://oppfy.app/post/${postId}`;

    const url = Platform.select({
      ios: `sms:${phoneNumber}&body=${encodeURIComponent(message)}`,
      android: `sms:${phoneNumber}?body=${encodeURIComponent(message)}`,
      default: `sms:${phoneNumber}?body=${encodeURIComponent(message)}`,
    });

    await Linking.openURL(url);
  };

  return {
    isSharing,
    sharePostToNewUser,
    sharePost,
    shareProfile,
  };
};

export default useShare;
