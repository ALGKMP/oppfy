import { useState } from "react";
import { Alert, Platform, Share } from "react-native";
import * as Linking from "expo-linking";
import { useTheme } from "tamagui";

interface SharePostToNewUserOptions {
  postId: string;
  phoneNumber: string;
}

const NEW_USER_MESSAGE_TEMPLATES = [
  "🚨 I JUST EXPOSED YOU! Posted your first pic on Oppfy! Come see what I caught you doing",
  "👀 Caught you in 4K! I created your Oppfy profile & posted your first pic",
  "🔥 Time to expose you on Oppfy! I just put up your first post",
  "😱 YOU'VE BEEN OPPED! I just posted your first picture. Come see what I caught",
  "🫣 I'm making your Oppfy profile blow up & you don't even know it yet",
  "📸 SURPRISE! I'm making you go viral on Oppfy & you're not even on it",
];

const SHARE_MESSAGE_TEMPLATES = [
  "👀 You gotta see this on Oppfy",
  "🔥 Check this out on Oppfy",
  "😱 Look what I found on Oppfy",
  "🫣 This is too good not to share",
  "📸 Caught in 4K on Oppfy",
];

const SHARE_PROFILE_TEMPLATES = [
  "👀 Check out my Oppfy profile",
  "🔥 Follow me on Oppfy",
  "💫 Join me on Oppfy",
  "📸 This is my Oppfy profile",
  "🫣 Come find me on Oppfy",
];

const useShare = () => {
  const theme = useTheme();
  const [isSharing, setIsSharing] = useState(false);

  const sharePost = async (postId: string) => {
    setIsSharing(true);
    try {
      const randomMessage =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        SHARE_MESSAGE_TEMPLATES[
          Math.floor(Math.random() * SHARE_MESSAGE_TEMPLATES.length)
        ]!;

      const url = `https://oppfy.app/post/${postId}`;

      await Share.share(
        {
          message: randomMessage,
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
      const randomMessage =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        SHARE_PROFILE_TEMPLATES[
          Math.floor(Math.random() * SHARE_PROFILE_TEMPLATES.length)
        ]!;

      const url = `https://oppfy.app/profile/${username}`;

      await Share.share(
        {
          message: randomMessage,
          url,
        },
        {
          dialogTitle: "Share Profile",
          subject: "Check out my profile on Oppfy",
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
    const randomMessage =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      NEW_USER_MESSAGE_TEMPLATES[
        Math.floor(Math.random() * NEW_USER_MESSAGE_TEMPLATES.length)
      ]!;

    const message = `${randomMessage}\n\n💫 Oppfy - Where we post for each other. Download now & get me back 😈\n\nhttps://oppfy.app/post/${postId}`;

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
