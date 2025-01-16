import React, { useCallback, useRef, useState } from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { ResizeMode, Video } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { getToken, useTheme } from "tamagui";

import {
  Circle,
  Paragraph,
  Skeleton,
  Text,
  View,
  XStack,
  YStack,
} from "~/components/ui";
import { useAudio } from "~/contexts/AudioContext";
import useRouteProfile from "~/hooks/useRouteProfile";
import { useLikePost } from "../../hooks/post/useLikePost";
import Avatar from "../Avatar";
import GradientHeart, { useHeartAnimations } from "../Icons/GradientHeart";
import Mute, { useMuteAnimations } from "../Icons/Mute";
import { FloatingComments } from "./FloatingComments";
import MorePostOptionsButton from "./MorePostOptionsButton";
import PostCaption from "./PostCaption";
import PostDate from "./PostDate";
import { PostImage } from "./PostImage";
import { PostStats } from "./PostStats";
import { PostVideo } from "./PostVideo";

type ProfilePicture = ImageSourcePropType | string | undefined | null;

interface Self {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

interface Author {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

interface Recipient {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

interface MediaDimensions {
  width: number;
  height: number;
}

interface Media {
  id: string;
  type: "image" | "video";
  url: string;
  isViewable: boolean;
  dimensions: MediaDimensions;
  recipient: Recipient;
}

interface Stats {
  likes: number;
  comments: number;
  hasLiked: boolean;
}

export interface PostData {
  postId: string;
  createdAt: Date;
  caption: string;
  self: Self;
  author: Author;
  recipient: Recipient;
  media: Media;
  stats: Stats;
}

type PostCardProps = PostData & {
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
};

const PostCard = (props: PostCardProps) => {
  const { routeProfile } = useRouteProfile();

  return (
    <View borderRadius="$8" overflow="hidden">
      {props.media.type === "image" ? (
        <PostImage
          endpoint={props.endpoint}
          media={props.media}
          stats={props.stats}
        />
      ) : (
        <PostVideo
          endpoint={props.endpoint}
          media={props.media}
          stats={props.stats}
        />
      )}

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Top Header - Overlaid on image */}
      <XStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        paddingVertical="$4"
        paddingHorizontal="$4"
        justifyContent="space-between"
        zIndex={2}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            routeProfile({
              userId: props.author.id,
              username: props.author.username,
            });
          }}
        >
          <XStack gap="$3" alignItems="center">
            <Avatar source={props.author.profilePicture} size={44} bordered />

            <YStack>
              <Text
                color="white"
                fontWeight="600"
                fontSize="$5"
                shadowColor="black"
                shadowOffset={{ width: 1, height: 1 }}
                shadowOpacity={0.4}
                shadowRadius={3}
              >
                {props.author.username}
              </Text>
              <PostDate createdAt={props.createdAt} />
            </YStack>
          </XStack>
        </TouchableOpacity>

        <XStack alignItems="center" justifyContent="flex-end" width="$5">
          <MorePostOptionsButton
            postId={props.postId}
            recipientUserId={props.recipient.id}
            mediaUrl={props.media.url}
            style={{ position: "relative", right: 0, bottom: 0 }}
          />
        </XStack>
      </XStack>

      {/* Floating Action Buttons - Vertical Stack on Right side */}
      <PostStats
        postId={props.postId}
        recipientUserId={props.recipient.id}
        endpoint={props.endpoint}
        stats={props.stats}
      />

      {/* Bottom Content Overlay */}
      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        paddingHorizontal="$4"
        paddingVertical="$4"
        zIndex={2}
        gap="$2"
      >
        {props.stats.comments > 0 && (
          <FloatingComments
            comments={[
              { id: "1", username: "user1", content: "🔥 This is amazing!" },
              { id: "2", username: "user2", content: "Love this! 💫" },
              { id: "3", username: "user3", content: "Incredible shot 📸" },
            ]}
            isViewable={props.media.isViewable}
            postId={props.postId}
            endpoint={props.endpoint}
            postRecipientUserId={props.recipient.id}
          />
        )}
        <PostCaption caption={props.caption} />
      </YStack>
    </View>
  );
};

PostCard.Skeleton = function PostCardLoading() {
  return (
    <YStack marginVertical="$2">
      <View>
        <Skeleton width="100%" height={600} radius={0} />
        <View position="absolute" top={16} left={16} right={16}>
          <XStack alignItems="center" gap="$3">
            <Skeleton size={44} circular />
            <YStack gap="$2">
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={14} />
            </YStack>
          </XStack>
        </View>
      </View>
    </YStack>
  );
};

export default PostCard;
