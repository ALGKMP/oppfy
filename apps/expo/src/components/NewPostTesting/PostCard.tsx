import React, { useCallback, useState } from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "@tamagui/lucide-icons";
import {
  Button,
  getToken,
  Paragraph,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { TimeAgo } from "~/components/Texts";
import Avatar from "../Avatar";
import CardContainer from "../Containers/CardContainer";
import GradientHeart, { useHeartAnimations } from "../Icons/GradientHeart";

type MediaType = "image" | "video";

type ProfilePicture = ImageSourcePropType | string | null;

interface Self {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

interface Author {
  id: string;
  username: string;
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
  self: Self;
  author: Author;
  recipient: Recipient;
  media: Media;
  stats: Stats;
}

interface PostCallbacks {
  onLikePressed: () => void;
  onLikeDoubleTapped: () => void;
  onComment: () => void;
  onShare: () => void;
  onMoreOptions: () => void;
  onAuthorPress: () => void;
  onRecipientPress: () => void;
}

type PostCardProps = PostData & PostCallbacks & { hasLiked: boolean };

const ASPECT_RATIO = 3 / 4;

const PostCard = (props: PostCardProps) => {
  const { hearts, addHeart } = useHeartAnimations();

  const [isExpanded, setIsExpanded] = useState(false);

  const addHeartJS = useCallback(
    (x: number, y: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addHeart(x, y);
      props.onLikeDoubleTapped();
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

  const formatTimeAgo = ({ value, unit }: { value: number; unit: string }) => {
    if (value === 0 && unit === "second") return "Just now";
    const pluralS = value !== 1 ? "s" : "";
    return `${value} ${unit}${pluralS} ago`;
  };

  return (
    <CardContainer>
      <YStack gap="$3">
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap="$3">
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onAuthorPress();
              }}
            >
              <Avatar source={props.recipient.profilePicture} bordered />
            </TouchableOpacity>

            <YStack gap="$1">
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  props.onRecipientPress();
                }}
              >
                <SizableText fontWeight="bold" lineHeight={0}>
                  {props.recipient.username}
                </SizableText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  props.onAuthorPress();
                }}
              >
                <SizableText theme="alt1" lineHeight={0}>
                  Posted by{" "}
                  <SizableText fontWeight="bold" color="$primary">
                    {props.author.username}
                  </SizableText>
                </SizableText>
              </TouchableOpacity>
              <TimeAgo
                size="$2"
                theme="alt2"
                lineHeight={0}
                date={props.createdAt}
                format={formatTimeAgo}
              />
            </YStack>
          </XStack>

          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              props.onMoreOptions();
            }}
          >
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
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2">
              <Button
                icon={
                  <Heart
                    size={20}
                    color={props.hasLiked ? "$red10" : "$gray10"}
                  />
                }
                borderRadius="$8"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  props.onLikePressed();
                }}
              >
                <SizableText color={props.hasLiked ? "$red10" : "$gray10"}>
                  {props.stats.likes}
                </SizableText>
              </Button>
              <Button
                icon={<MessageCircle size={20} color="$gray10" />}
                borderRadius="$8"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  props.onComment();
                }}
              >
                <SizableText color="$gray10">
                  {props.stats.comments}
                </SizableText>
              </Button>
            </XStack>
            <Button
              icon={<Share2 size={20} color="$gray10" />}
              borderRadius="$8"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onShare();
              }}
            />
          </XStack>

          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Paragraph color="$gray10">
              {isExpanded ? (
                props.caption
              ) : (
                <>
                  {props.caption.slice(0, 110)}
                  {props.caption.length > 110 && (
                    <>
                      ...
                      <Text color="$gray8"> more</Text>
                    </>
                  )}
                </>
              )}
            </Paragraph>
          </TouchableOpacity>
        </YStack>
      </YStack>
    </CardContainer>
  );
};

export default PostCard;
