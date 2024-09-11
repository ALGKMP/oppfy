import React, { useCallback, useState } from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Video } from "expo-av";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  SendHorizontal,
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
import Avatar from "../../Avatar";
import CardContainer from "../../Containers/CardContainer";
import GradientHeart, { useHeartAnimations } from "../../Icons/GradientHeart";

type MediaType = "image" | "video";

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
  type: MediaType;
  url: string;
  dimensions: MediaDimensions;
}

interface Stats {
  likes: number;
  comments: number;
}

export interface PostData {
  id: string;
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

    const buttonLikeScale = useSharedValue(1);

    const heartButtonAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: buttonLikeScale.value }],
      };
    });

  const handleLikePress = useCallback(() => {
    buttonLikeScale.value = withSpring(1.2, {
      damping: 10,
      stiffness: 200,
    }, () => {
      buttonLikeScale.value = withSpring(1, {
        damping: 10,
        stiffness: 200,
      });
    });
    props.onLikePressed();
  }, [props.onLikePressed]);

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
              <View style={{ position: "absolute", bottom: 15, left: 15 }}>
                <XStack alignItems="center" gap="$3">
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Light,
                      );
                      props.onAuthorPress();
                    }}
                  >
                    <Avatar source={props.recipient.profilePicture} size={40} />
                  </TouchableOpacity>

                  <YStack gap="$1">
                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
                        props.onRecipientPress();
                      }}
                    >
                      <SizableText fontWeight="bold" lineHeight={0}>
                        {props.recipient.username}
                      </SizableText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
                        props.onAuthorPress();
                      }}
                    >
                      <XStack alignItems="center" gap="$2">
                        <Avatar
                          source={props.author.profilePicture}
                          size={20}
                          // bordered
                        />
                        <SizableText size="$2" fontWeight="bold" lineHeight={0}>
                          Opped by{" "}
                          <SizableText fontWeight="bold" color="$primary">
                            {props.author.username}
                          </SizableText>
                        </SizableText>
                      </XStack>
                    </TouchableOpacity>
                  </YStack>
                </XStack>
              </View>
              <TouchableOpacity
                style={{ position: "absolute", bottom: 15, right: 15 }}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  props.onMoreOptions();
                }}
              >
                <MoreHorizontal />
              </TouchableOpacity>
            </View>
          </GestureDetector>
        </View>

        {/* Under post */}
        <View flex={1} alignSelf="stretch" padding="$2.5" paddingTop="$3">
          <XStack gap="$4" alignItems="center" marginBottom="$2">
            {/* Like Button */}
            <TouchableOpacity onPress={handleLikePress}>
              <Animated.View style={[heartButtonAnimatedStyle]}>
                <Heart
                  size="$2"
                  padding="$3"
                  color={props.hasLiked ? "red" : "$gray12"}
                  fill="red"
                  fillOpacity={props.hasLiked ? 1 : 0}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Comment Button */}
            <TouchableOpacity
              onPress={() => props.onComment()}
            >
              <MessageCircle size="$2" color="$gray12" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              onPress={() => props.onShare()}
              // setIsShareModalVisible(true)}
            >
              <Send size={26} color="$gray12" marginLeft="$-1.5" />
            </TouchableOpacity>
          </XStack>

          {/* Likes Count */}
          {props.stats.likes > 0 && (
            <TouchableOpacity>
              <SizableText size="$3" fontWeight="bold" marginBottom="$1">
                {props.stats.likes > 0
                  ? `${props.stats.likes} ${props.stats.likes === 1 ? "like" : "likes"}`
                  : ""}
              </SizableText>
            </TouchableOpacity>
          )}

          {/* Caption */}
          {props.caption && (
            <View flex={1} alignItems="flex-start">
              <TouchableOpacity
                onPress={() => {
                  setIsExpanded(!isExpanded);
                }}
              >
                <Text>
                  <Text fontWeight="bold">{props.author.username} </Text>
                  <Text numberOfLines={isExpanded ? 0 : 2}>
                    {props.caption}
                    {isExpanded && (
                      <Text color="$gray10"> more</Text>
                    )}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Comments Count */}
          <TouchableOpacity onPress={() => props.onComment()}>
            <SizableText size="$3" color="$gray10" marginTop="$1">
              {props.stats.comments > 0
                ? `View ${props.stats.comments > 1 ? "all " : ""}${props.stats.comments} ${props.stats.comments === 1 ? "comment" : "comments"}`
                : "Be the first to comment"}
            </SizableText>
          </TouchableOpacity>

          {/* Post Date */}
          <SizableText size="$2" color="$gray10" marginTop="$1">
            <TimeAgo
              size="$2"
              theme="alt2"
              lineHeight={0}
              date={props.createdAt}
              format={formatTimeAgo}
            />
          </SizableText>
        </View>

      </YStack>
    </CardContainer>
  );
};

export default PostCard;
