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

interface Stats {
  likes: number;
  comments: number;
}

type MediaType = "image" | "video";

interface MediaDimensions {
  width: number;
  height: number;
}

interface PostData {
  id: number;

  authorUsername: string;

  recipientUsername: string;
  recipientProfilePicture: ImageSourcePropType | string | null;

  mediaType: MediaType;
  mediaUrl: string;
  mediaDimensions: MediaDimensions;

  stats: Stats;

  caption: string;

  createdAt: Date;
}

interface PostProps {
  post: PostData;
}

const ASPECT_RATIO = 3 / 4;

const Post = (props: PostProps) => {
  const renderMedia = (
    type: MediaType,
    url: string,
    dimensions: MediaDimensions,
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
            <Avatar url={props.post.recipientProfilePicture} />

            <YStack gap="$1">
              <SizableText fontWeight="bold" lineHeight={0}>
                {props.post.recipientUsername}
              </SizableText>

              <TouchableOpacity>
                <SizableText theme="alt1" lineHeight={0}>
                  Posted by{" "}
                  <SizableText fontWeight="bold" color="$blue9">
                    {props.post.authorUsername}
                  </SizableText>
                </SizableText>
              </TouchableOpacity>
            </YStack>
          </XStack>

          <MoreHorizontal />
        </XStack>

        <View marginHorizontal="$-3">
          {renderMedia(
            props.post.mediaType,
            props.post.mediaUrl,
            props.post.mediaDimensions,
          )}
        </View>

        <YStack gap="$2">
          <XStack gap="$3">
            <Heart size="$2" />
            <MessageCircle size="$2" />
            <Send size="$2" />
          </XStack>

          {props.post.stats.comments === 0 && (
            <SizableText size="$4" lineHeight={0} theme="alt1">
              Be the first to comment
            </SizableText>
          )}

          <TimeAgo
            size="$3"
            lineHeight={0}
            theme="alt1"
            date={props.post.createdAt}
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
