import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DimensionValue } from "react-native";
import { Animated, Dimensions, Pressable, StyleSheet } from "react-native";
import type { TextInput } from "react-native-gesture-handler";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { getToken, useTheme } from "tamagui";

import PlayPause, {
  usePlayPauseAnimations,
} from "~/components/Icons/PlayPause";
import {
  Avatar,
  Button,
  CardContainer,
  HeaderTitle,
  Icon,
  ScreenView,
  Spinner,
  Text,
  useBottomSheetController,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useCelebration } from "~/contexts/CelebrationContext";
import { useUploadMedia } from "~/hooks/media";
import type {
  UploadMediaInputNotOnApp,
  UploadMediaInputOnApp,
} from "~/hooks/media/useUploadMedia";
import useShare from "~/hooks/useShare";
import { api } from "~/utils/api";

interface CreatePostBaseParams extends Record<string, string> {
  uri: string;
  type: "photo" | "video";
  height: string;
  width: string;
}

interface CreatePostWithRecipient extends CreatePostBaseParams {
  recipient: string;
  userType: "onApp";
}

interface CreatePostWithPhoneNumber extends CreatePostBaseParams {
  number: string;
  userType: "notOnApp";
  name: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_PREVIEW_WIDTH = SCREEN_WIDTH;
const MAX_PREVIEW_HEIGHT = SCREEN_WIDTH; // Maximum preview height

const SEND_BUTTON_MESSAGES = [(name: string) => `Post for ${name} 📸`];

const CaptionSheet = ({
  caption,
  onSave,
}: {
  caption: string;
  onSave: (text: string) => void;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [localDraftCaption, setLocalDraftCaption] = useState(caption);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  return (
    <YStack flex={1}>
      <YStack flex={1} padding="$4" gap="$4">
        <XStack justifyContent="space-between">
          <Text fontSize="$6" fontWeight="bold">
            Caption
          </Text>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" color="$gray10">
              {localDraftCaption.length}/255
            </Text>
            <TouchableOpacity onPress={() => setLocalDraftCaption("")}>
              <Ionicons name="close-circle" size={20} color={theme.gray8.val} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        <BottomSheetTextInput
          ref={inputRef}
          placeholder="Write a caption..."
          value={localDraftCaption}
          onChangeText={setLocalDraftCaption}
          multiline
          maxLength={255}
          style={{
            fontWeight: "bold",
            color: theme.color.val,
            backgroundColor: theme.gray5.val,
            padding: getToken("$4", "space") as DimensionValue,
            borderRadius: getToken("$6", "radius") as string,
            height: 100,
            textAlignVertical: "top",
          }}
        />
      </YStack>

      <XStack padding="$4" paddingBottom={insets.bottom}>
        <Button
          flex={1}
          variant="primary"
          disabled={localDraftCaption === caption}
          onPress={() => onSave(localDraftCaption)}
        >
          Save
        </Button>
      </XStack>
    </YStack>
  );
};

// Floating decoration component
const FloatingDecoration = ({
  children,
  delay = 0,
  duration = 3000,
  initialPosition = { x: 0, y: 0 },
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialPosition?: { x: number; y: number };
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const startAnimation = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.delay(duration - 1600),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        fadeAnim.setValue(0);
        floatAnim.setValue(0);
        startAnimation();
      });
    };

    startAnimation();
  }, [fadeAnim, floatAnim, delay, duration]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: initialPosition.x,
        top: initialPosition.y,
        opacity: fadeAnim,
        transform: [
          {
            translateY: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -100],
            }),
          },
          {
            translateX: floatAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 20, -10],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

const CreatePost = () => {
  const router = useRouter();
  const theme = useTheme();
  const { show, hide } = useBottomSheetController();
  const { sharePostToNewUser } = useShare();
  const { showCelebration } = useCelebration();

  // Add TRPC utils for cache invalidation
  const utils = api.useUtils();

  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation for media preview
  const [pulseAnim] = useState(new Animated.Value(1));

  const {
    type,
    uri,
    height,
    width,
    recipientName,
    recipientUsername,
    recipientImage,
    ...params
  } = useLocalSearchParams<
    CreatePostWithRecipient | CreatePostWithPhoneNumber
  >();

  const { uploadVideoMutation, uploadPhotoMutation } = useUploadMedia();

  const displayName = useMemo(() => {
    if (params.userType === "onApp") {
      return recipientUsername ?? recipientName ?? "THEM";
    }
    return recipientName?.split(" ")[0] ?? "THEM";
  }, [params.userType, recipientName, recipientUsername]);

  const [buttonMessage] = useState(() => {
    const messageTemplate =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      SEND_BUTTON_MESSAGES[
        Math.floor(Math.random() * SEND_BUTTON_MESSAGES.length)
      ]!;
    return messageTemplate(displayName.toUpperCase());
  });

  // Pulse animation for media preview
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnim]);

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      const baseData = {
        uri: uri,
        width: parseInt(width),
        height: parseInt(height),
        caption,
      };

      const input =
        params.userType === "onApp"
          ? ({
              ...baseData,
              recipient: params.recipient,
              type: "onApp",
            } satisfies UploadMediaInputOnApp)
          : ({
              ...baseData,
              number: params.number,
              type: "notOnApp",
              name: params.name,
            } satisfies UploadMediaInputNotOnApp);

      const postId =
        type === "photo"
          ? await uploadPhotoMutation.mutateAsync(input)
          : await uploadVideoMutation.mutateAsync(input);

      if (params.userType === "notOnApp" && params.number) {
        await sharePostToNewUser({
          postId,
          phoneNumber: params.number,
        });
      }

      // Invalidate the posts feed cache so it refreshes with the new post
      await utils.post.paginatePostsForFeed.invalidate();

      // Navigate to home first
      router.dismissTo("/(app)/(bottom-tabs)/(home)");

      // Trigger celebration animation with a small delay to ensure navigation completes
      setTimeout(() => {
        showCelebration({
          recipientName: recipientName || displayName,
          recipientImage: recipientImage,
        });
      }, 100);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCaptionSheet = () => {
    show({
      title: "Add Caption",
      children: (
        <CaptionSheet
          caption={caption}
          onSave={(text) => {
            setCaption(text);
            hide();
          }}
        />
      ),
    });
  };

  // Calculate the preview size using the actual media aspect ratio
  const mediaWidth = parseInt(width, 10);
  const mediaHeight = parseInt(height, 10);
  const aspectRatio = mediaWidth / mediaHeight;

  // Calculate preview dimensions based on actual aspect ratio
  let previewWidth = MAX_PREVIEW_WIDTH;
  let previewHeight = previewWidth / aspectRatio;

  // Cap the height to prevent extremely tall previews
  if (previewHeight > MAX_PREVIEW_HEIGHT) {
    previewHeight = MAX_PREVIEW_HEIGHT;
    previewWidth = previewHeight * aspectRatio;
  }

  return (
    <ScreenView paddingBottom={0} safeAreaEdges={["bottom"]}>
      {/* Floating decorations */}
      <FloatingDecoration
        delay={0}
        duration={4000}
        initialPosition={{ x: 50, y: 100 }}
      >
        <Text fontSize={24}>✨</Text>
      </FloatingDecoration>
      <FloatingDecoration
        delay={1000}
        duration={3500}
        initialPosition={{ x: SCREEN_WIDTH - 80, y: 150 }}
      >
        <Text fontSize={20}>🎉</Text>
      </FloatingDecoration>
      <FloatingDecoration
        delay={2000}
        duration={4500}
        initialPosition={{ x: 30, y: 300 }}
      >
        <Text fontSize={18}>💫</Text>
      </FloatingDecoration>
      <FloatingDecoration
        delay={500}
        duration={3000}
        initialPosition={{ x: SCREEN_WIDTH - 60, y: 400 }}
      >
        <Text fontSize={22}>🌟</Text>
      </FloatingDecoration>

      <YStack flex={1} gap="$5">
        <YStack gap="$4" alignItems="center">
          {/* Enhanced media preview with decorative frame and animation */}
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              shadowColor: "rgba(0,0,0,0.3)",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 1,
              shadowRadius: 20,
            }}
          >
            <View padding="$1.5" borderColor="rgba(0,0,0,0.1)">
              <View overflow="hidden" position="relative">
                {type === "photo" ? (
                  <Image
                    source={{ uri }}
                    style={[
                      styles.media,
                      { width: previewWidth, height: previewHeight },
                    ]}
                    contentFit="contain"
                  />
                ) : (
                  <PreviewVideo
                    uri={uri}
                    width={previewWidth}
                    height={previewHeight}
                  />
                )}
              </View>
            </View>
          </Animated.View>

          <XStack gap="$2" alignItems="center">
            <Avatar
              size={28}
              source={recipientImage ?? DefaultProfilePicture}
              bordered
            />
            <Text>
              Posting to <Text fontWeight="bold">@{displayName}</Text>
            </Text>
          </XStack>
        </YStack>

        <CardContainer padding="$4" paddingBottom="$5">
          <YStack gap="$3">
            <HeaderTitle>Post Details</HeaderTitle>
            <TouchableOpacity onPress={openCaptionSheet}>
              <XStack
                justifyContent="space-between"
                alignItems="center"
                onPress={openCaptionSheet}
              >
                <XStack flex={1} alignItems="center" gap="$3" mr="$4">
                  <Icon name="chatbubble-outline" />
                  <View flex={1}>
                    <Text fontSize="$5" fontWeight="500">
                      {caption || "Add caption"}
                    </Text>
                  </View>
                </XStack>
                <Icon name="chevron-forward" />
              </XStack>
            </TouchableOpacity>
          </YStack>
        </CardContainer>
      </YStack>

      <Button
        variant="primary"
        disabled={isLoading}
        onPress={onSubmit}
        pressStyle={{ scale: 0.95 }}
        animation="bouncy"
      >
        {isLoading ? <Spinner size="small" color="$color" /> : buttonMessage}
      </Button>
    </ScreenView>
  );
};

const PreviewVideo = ({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) => {
  const { playPauseIcons, addPlay, addPause } = usePlayPauseAnimations();

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
  });

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
      addPause();
    } else {
      player.play();
      addPlay();
    }
  };

  return (
    <Pressable
      onPress={togglePlayback}
      style={[styles.mediaContainer, { width, height }]}
    >
      <VideoView
        style={[styles.media, { width, height }]}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />
      {playPauseIcons.map((icon) => (
        <PlayPause key={icon.id} isPlaying={icon.isPlaying} />
      ))}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  media: {
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "white",
  },
  mediaContainer: {
    position: "relative",
    overflow: "hidden",
  },
});

export default CreatePost;
