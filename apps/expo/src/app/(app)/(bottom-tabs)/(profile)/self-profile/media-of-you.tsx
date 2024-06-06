import React, { useEffect, useState } from "react";
import { Dimensions, TouchableOpacity } from "react-native";
import { SharedValue, withSpring } from "react-native-reanimated";
import { Image } from "expo-image";
import { FontAwesome } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Heart, Send } from "@tamagui/lucide-icons";
import {
  Avatar,
  Separator,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

// import { api } from "@oppfy/utils";

const { width: screenWidth } = Dimensions.get("window");

interface DataItem {
  author: string;
  authorProfilePicture: string;
  recipient: string;
  recipientProfilePicture: string;

  width: number;
  height: number;

  isFollowing: boolean;
  hasLiked: boolean;

  key: string;
  comments: number;
  likes: number;
  image: string;
  caption: string;
}

const data: DataItem[] = [
  {
    author: "JohnDoe",
    authorProfilePicture:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    recipient: "JaneSmith",
    recipientProfilePicture: "https://example.com/recipient1.jpg",
    isFollowing: true,
    hasLiked: false,
    key: "1",
    height: 500,
    width: 500,
    comments: 100,
    likes: 50,
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    caption: "Enjoying the sunset!",
  },
  {
    author: "DavidSmith",
    authorProfilePicture: "https://example.com/author8.jpg",
    width: 500,
    height: 500,
    recipient: "EmilyClark",
    recipientProfilePicture: "https://example.com/recipient8.jpg",
    isFollowing: false,
    hasLiked: true,
    key: "8",
    comments: 100,
    likes: 50,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978",
    caption: "Birthday celebrations.",
  },
  {
    author: "GraceLee",
    authorProfilePicture: "https://example.com/author9.jpg",
    recipient: "HenryMiller",
    recipientProfilePicture: "https://example.com/recipient9.jpg",
    isFollowing: true,
    hasLiked: false,
    width: 500,
    height: 500,
    key: "9",
    comments: 100,
    likes: 50,
    image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0",
    caption: "Night out with friends fjsdklfjsdklfjsldk sdljkfsd jlksd jflksd jsldkj fsklsdj kwefjiosldjfwo0isjfoiw  fjsdklfjasdlk fsdalkjfasd fasldkf sdalkfsad lkfa jsadjf sdlakasdf hello world.",
  },
];

const PostItem = ({ item }: { item: DataItem }) => {
  const handleLike = (key: string) => {};
  const handleComment = (key: string) => {};
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const renderCaption = () => {
    const maxLength = 100; // Set max length for the caption
    if (item.caption.length <= maxLength || isExpanded) {
      return item.caption;
    }
    return `${item.caption.substring(0, maxLength)}...`;
  };

  if (status === "loading") {
    return (
      <View flex={1} alignItems="center" justifyContent="center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      borderRadius={20}
    >
      <Image
        source={{ uri: item.image }}
        style={[
          {
            width: item.width,
            height: item.height,
          },
        ]}
        // contentFit="contain"
      />
      <XStack
        gap={"$2.5"}
        position="absolute"
        top={10}
        left={10}
        justifyContent="flex-start"
        alignContent="center"
      >
        <Avatar circular size="$5">
          <Avatar.Image
            accessibilityLabel="Cam"
            src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
          />
          <Avatar.Fallback backgroundColor="$blue10" />
        </Avatar>
        <YStack gap={"$1"} justifyContent="center">
          <SizableText
            size={"$3"}
            lineHeight={14}
            margin={0}
            padding={0}
            shadowRadius={3}
            shadowOpacity={0.5}
            fontWeight={"bold"}
          >
            @AuthorUsername
          </SizableText>
          <XStack gap={"$1"} alignItems="center">
            <SizableText size={"$3"} lineHeight={15} marginTop={0} padding={0}>
              📸
            </SizableText>
            <SizableText size={"$2"} lineHeight={15} color={"$gray2"}>
              posted by:
            </SizableText>
            <SizableText
              size={"$2"}
              lineHeight={15}
              fontWeight={"bold"}
              color={"$blue9"}
            >
              @RecipientUsername
            </SizableText>
          </XStack>
        </YStack>
      </XStack>

      {/* Under Post Shit */}
      <View
        flex={1}
        alignSelf="stretch"
        paddingTop={"$3"}
        paddingLeft={"$2"}
        paddingRight={"$2"}
        paddingBottom={"$4"}
        borderBottomRightRadius={"$8"}
        borderBottomLeftRadius={"$8"}
        backgroundColor={"$gray2"}
        marginBottom={"$5"}
      >
        <XStack flex={1} gap={"$2"}>
          {/* Comment Button */}
          <View flex={4} justifyContent="center">
            <TouchableOpacity>
              <View
                justifyContent="center"
                alignItems="flex-start"
                backgroundColor={"$gray5"}
                borderRadius={"$7"}
              >
                <Text fontWeight={"bold"} padding={"$3"} color={"$gray9"}>
                  Comment
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Like Button */}
          <View flex={1} justifyContent="center">
            <TouchableOpacity>
              <View
                justifyContent="center"
                alignItems="center"
                borderRadius={"$7"}
                padding={"$2"}
                backgroundColor={"$gray5"}
              >
                <Heart size={24} padding={"$3"} color="$gray12" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <View flex={1} justifyContent="center">
            <TouchableOpacity>
              <View
                flex={1}
                justifyContent="center"
                alignItems="center"
                padding="$2"
                borderRadius={"$7"}
                backgroundColor={"$gray5"}
              >
                <Send size={24} padding={"$3"} color="$gray12" />
              </View>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Comments and Likes */}
        <XStack flex={1} gap="$2">
          <View flex={4} alignItems="flex-start" paddingLeft={"$2.5"}>
            <SizableText
              size={"$2"}
              fontWeight={"bold"}
              color={"$gray11"}
              opacity={0.8}
            >
              102 other comments
            </SizableText>
          </View>
          {/* Like */}
          {/* TODO: Animation */}
          <View flex={2} alignItems={"flex-start"}>
            <SizableText
              size={"$2"}
              fontWeight={"bold"}
              color={"$gray11"}
              opacity={0.8}
            >
              1k likes
            </SizableText>
          </View>
        </XStack>

        <View flex={1} alignItems={"flex-start"}>
          <TouchableOpacity onPress={toggleExpanded}>
            <Text
              paddingLeft={"$2"}
              borderBottomLeftRadius={10}
              borderBottomRightRadius={10}
            >
              {renderCaption()}
              {item.caption.length > 100 && !isExpanded ? " view more..." : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const MediaOfYou = () => {
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "loading",
  );

  return (
    <View flex={1}>
      <Separator margin={10} borderColor={"white"} />
      <FlashList
        data={data}
        numColumns={1}
        renderItem={(data) => <PostItem item={data.item} />}
        estimatedItemSize={screenWidth}
      />
    </View>
  );
};

export default MediaOfYou;
