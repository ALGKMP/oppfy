import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Video } from "expo-av";
import { Image } from "expo-image";
import defaultProfilePicture from "@assets/default-profile-picture.jpg";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share,
  Share2,
} from "@tamagui/lucide-icons";
import { getToken, SizableText, View, XStack, YStack } from "tamagui";

import { TimeAgo } from "~/components/Texts";
import CardContainer from "../Containers/CardContainer";
import GradientHeart, { useHeartAnimations } from "../Icons/GradientHeart";

type MediaType = "image" | "video";

interface Author {
  id: string;
  username: string;
}

interface Recipient {
  id: string;
  username: string;
  profilePicture: ImageSourcePropType | string | null;
}

interface MediaDimensions {
  width: number;
  height: number;
}

interface Media {
  type: MediaType;
  url: string;
  dimensions: MediaDimensions;
}

interface Stats {
  likes: number;
  comments: number;
}

export interface PostData {
  id: number;
  createdAt: Date;

  caption: string;
  author: Author;
  recipient: Recipient;
  media: Media;
  stats: Stats;
}

interface PostCallbacks {
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMoreOptions: () => void;
  onAuthorPress: () => void;
  onRecipientPress: () => void;
}

type PostCardProps = PostData & PostCallbacks;

const ASPECT_RATIO = 3 / 4;

const PostCard = (props: PostCardProps) => {
  const { hearts, addHeart } = useHeartAnimations();

  const addHeartJS = useCallback(
    (x: number, y: number) => {
      addHeart(x, y);
      props.onLike();
    },
    [addHeart, props],
  );

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((event) => runOnJS(addHeartJS)(event.x, event.y));

  const renderMedia = (
    type: MediaType,
    url: string,
    _dimensions: MediaDimensions,
  ) => {
    const style = {
      borderRadius: getToken("$8", "radius") as number,
      width: "100%" as const,
      aspectRatio: ASPECT_RATIO,
    };

    switch (type) {
      case "image":
        return <Image source={{ uri: url }} style={style} contentFit="cover" />;
      case "video":
        return <Video source={{ uri: url }} style={style} />;
    }
  };

  return (
    <CardContainer>
      <YStack gap="$3">
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$3">
            <TouchableOpacity onPress={props.onAuthorPress}>
              <Avatar url={props.recipient.profilePicture} />
            </TouchableOpacity>

            <YStack gap="$1">
              <TouchableOpacity onPress={props.onRecipientPress}>
                <SizableText fontWeight="bold" lineHeight={0}>
                  {props.recipient.username}
                </SizableText>
              </TouchableOpacity>
              <TouchableOpacity onPress={props.onAuthorPress}>
                <SizableText theme="alt1" lineHeight={0}>
                  Posted by{" "}
                  <SizableText fontWeight="bold" color="$primary">
                    {props.author.username}
                  </SizableText>
                </SizableText>
              </TouchableOpacity>
            </YStack>
          </XStack>

          <TouchableOpacity onPress={props.onMoreOptions}>
            <MoreHorizontal />
          </TouchableOpacity>
        </XStack>

        <View marginHorizontal="$-3">
          <GestureDetector gesture={doubleTap}>
            <View>
              {renderMedia(
                props.media.type,
                props.media.url,
                props.media.dimensions,
              )}
              {hearts.map((heart) => (
                <GradientHeart
                  key={heart.id}
                  gradient={heart.gradient}
                  position={heart.position}
                />
              ))}
            </View>
          </GestureDetector>
        </View>

        <YStack gap="$2">
          <XStack gap="$3">
            <TouchableOpacity onPress={props.onLike}>
              <Heart size="$2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onComment}>
              <MessageCircle size="$2" />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onShare}>
              <Send size="$2" />
            </TouchableOpacity>
          </XStack>

          {props.stats.comments === 0 && (
            <SizableText size="$4" lineHeight={0} theme="alt1">
              Be the first to comment
            </SizableText>
          )}

          <TimeAgo
            size="$3"
            lineHeight={0}
            theme="alt1"
            date={props.createdAt}
            format={formatTimeAgo}
          />
        </YStack>
      </YStack>
    </CardContainer>
  );
};

const formatTimeAgo = ({ value, unit }: { value: number; unit: string }) => {
  if (value === 0 && unit === "second") return "Just now";
  const pluralS = value !== 1 ? "s" : "";
  return `About ${value} ${unit}${pluralS} ago`;
};

interface AvatarProps {
  url: ImageSourcePropType | string | null;
}

const Avatar = (props: AvatarProps) => (
  <Image
    source={props.url ?? defaultProfilePicture}
    style={{ width: 46, height: 46, borderRadius: 23 }}
  />
);

export default PostCard;
