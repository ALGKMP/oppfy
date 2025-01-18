import React from "react";
import { TouchableOpacity } from "react-native";
import type { ImageSourcePropType } from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { Avatar, Skeleton, Text, View, XStack, YStack } from "~/components/ui";
import useRouteProfile from "~/hooks/useRouteProfile";
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

export interface Author {
  id: string;
  username: string;
  profilePicture: ProfilePicture;
}

export interface Recipient {
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
  dimensions: MediaDimensions;
  recipient: Recipient;
}

interface Stats {
  likes: number;
  comments: number;
  hasLiked: boolean;
}

type Endpoint = "self-profile" | "other-profile" | "single-post" | "home-feed";

export interface PostCardProps {
  postId: string;
  createdAt: Date;
  caption: string;
  self: Self;
  author: Author;
  recipient: Recipient;
  media: Media;
  stats: Stats;
  endpoint: Endpoint;
  isViewable: boolean;
}

const PostCard = (props: PostCardProps) => {
  const { routeProfile } = useRouteProfile();

  return (
    <View borderRadius="$8" overflow="hidden">
      {props.media.type === "image" ? (
        <PostImage
          endpoint={props.endpoint}
          media={props.media}
          stats={props.stats}
          isViewable={props.isViewable}
        />
      ) : (
        <PostVideo
          endpoint={props.endpoint}
          media={props.media}
          stats={props.stats}
          isViewable={props.isViewable}
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
        <XStack gap="$3" alignItems="center">
          <TouchableOpacity
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              routeProfile({
                userId: props.recipient.id,
                username: props.recipient.username,
              });
            }}
          >
            <Avatar
              source={props.recipient.profilePicture}
              size={44}
              bordered
            />
          </TouchableOpacity>

          <YStack>
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                routeProfile({
                  userId: props.recipient.id,
                  username: props.recipient.username,
                });
              }}
            >
              <Text
                color="white"
                fontWeight="600"
                fontSize="$5"
                shadowColor="black"
                shadowOffset={{ width: 1, height: 1 }}
                shadowOpacity={0.4}
                shadowRadius={3}
              >
                {props.recipient.username}
              </Text>
            </TouchableOpacity>
            <XStack gap="$1" alignItems="center">
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  routeProfile({
                    userId: props.author.id,
                    username: props.author.username,
                  });
                }}
              >
                <Text
                  color="white"
                  fontWeight="500"
                  fontSize="$4"
                  shadowColor="black"
                  shadowOffset={{ width: 1, height: 1 }}
                  shadowOpacity={0.4}
                  shadowRadius={3}
                >
                  opped by {props.author.username}
                </Text>
              </TouchableOpacity>
              <Text
                color="white"
                fontWeight="500"
                fontSize="$4"
                shadowColor="black"
                shadowOffset={{ width: 1, height: 1 }}
                shadowOpacity={0.4}
                shadowRadius={3}
              >
                • <PostDate createdAt={props.createdAt} />
              </Text>
            </XStack>
          </YStack>
        </XStack>

        <XStack alignItems="center" justifyContent="flex-end" width="$5">
          <MorePostOptionsButton
            postId={props.postId}
            author={props.author}
            recipient={props.recipient}
            mediaUrl={props.media.url}
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
        {/* TODO: Implement backend */}
        {/* {props.stats.comments > 0 && (
          <FloatingComments
            comments={[
              { id: "1", username: "user1", content: "🔥 This is amazing!" },
              { id: "2", username: "user2", content: "Love this! 💫" },
              { id: "3", username: "user3", content: "Incredible shot 📸" },
            ]}
            postId={props.postId}
            postRecipientUserId={props.recipient.id}
            endpoint={props.endpoint}
            isViewable={props.isViewable}
          />
        )} */}
        <PostCaption caption={props.caption} />
      </YStack>
    </View>
  );
};

PostCard.Skeleton = function PostCardLoading() {
  return (
    <View borderRadius="$8" overflow="hidden" backgroundColor="$gray3">
      {/* Header */}
      <XStack
        paddingVertical="$4"
        paddingHorizontal="$4"
        justifyContent="space-between"
        alignItems="center"
      >
        <XStack gap="$3" alignItems="center">
          <Skeleton circular size={44} />
          <YStack gap="$2">
            <Skeleton width={120} height={18} />
            <Skeleton width={80} height={14} />
          </YStack>
        </XStack>
        <Skeleton width={24} height={24} />
      </XStack>

      {/* Media */}
      {/* <Skeleton width="100%" height={500} radius={0} /> */}
      <View width="100%" height={500} backgroundColor="$gray3" />

      {/* Bottom Content */}
      <YStack paddingHorizontal="$4" paddingVertical="$4" gap="$2">
        {/* Floating Comments Skeleton */}
        <Skeleton width={140} height={32} radius="$6" />

        {/* Caption Skeleton */}
        <YStack gap="$1">
          <Skeleton width="80%" height={16} />
          <Skeleton width="80%" height={16} />
        </YStack>
      </YStack>

      {/* Stats Buttons */}
      <YStack
        position="absolute"
        right={16}
        bottom={24}
        gap="$5"
        alignItems="flex-end"
      >
        <Skeleton size={44} circular />
        <Skeleton size={44} circular />
        <Skeleton size={44} circular />
      </YStack>
    </View>
  );
};

export default PostCard;
