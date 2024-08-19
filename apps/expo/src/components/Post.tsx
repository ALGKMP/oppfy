import React from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
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
import CardContainer from "./Containers/CardContainer";

type MediaType = "image" | "video";

interface Author {
  username: string;
}

interface Recipient {
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

interface PostProps {
  id: number;
  createdAt: Date;

  caption: string;
  author: Author;
  recipient: Recipient;
  media: Media;
  stats: Stats;
}

const ASPECT_RATIO = 3 / 4;

const Post = (props: PostProps) => {
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
            <Avatar url={props.recipient.profilePicture} />

            <YStack gap="$1">
              <SizableText fontWeight="bold" lineHeight={0}>
                {props.recipient.username}
              </SizableText>

              <TouchableOpacity>
                <SizableText theme="alt1" lineHeight={0}>
                  Posted by{" "}
                  <SizableText fontWeight="bold" color="$primary">
                    {props.author.username}
                  </SizableText>
                </SizableText>
              </TouchableOpacity>
            </YStack>
          </XStack>

          <MoreHorizontal />
        </XStack>

        <View marginHorizontal="$-3">
          {renderMedia(
            props.media.type,
            props.media.url,
            props.media.dimensions,
          )}
        </View>

        <YStack gap="$2">
          <XStack gap="$3">
            <Heart size="$2" />
            <MessageCircle size="$2" />
            <Send size="$2" />
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

export default Post;
