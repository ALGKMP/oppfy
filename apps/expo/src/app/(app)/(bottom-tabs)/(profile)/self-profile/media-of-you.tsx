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
  // {
  //   author: "JaneSmith",
  //   authorProfilePicture: "https://example.com/author2.jpg",
  //   recipient: "JohnDoe",
  //   recipientProfilePicture: "https://example.com/recipient2.jpg",
  //   isFollowing: false,
  //   hasLiked: true,
  //   key: "2",
  //   comments: 100,
  //   likes: 50,
  //   image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  //   caption: "Delicious breakfast.",
  // },
  // {
  //   author: "AliceWang",
  //   authorProfilePicture: "https://example.com/author3.jpg",
  //   recipient: "BobJones",
  //   recipientProfilePicture: "https://example.com/recipient3.jpg",
  //   isFollowing: true,
  //   hasLiked: true,
  //   key: "3",
  //   comments: 100,
  //   likes: 50,
  //   image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0",
  //   caption: "Hiking adventures.",
  // },
  // {
  //   author: "BobJones",
  //   authorProfilePicture: "https://example.com/author4.jpg",
  //   recipient: "AliceWang",
  //   recipientProfilePicture: "https://example.com/recipient4.jpg",
  //   isFollowing: false,
  //   hasLiked: false,
  //   key: "4",
  //   comments: 100,
  //   likes: 50,
  //   image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
  //   caption: "Family time.",
  // },
  // {
  //   author: "CharlieBrown",
  //   authorProfilePicture: "https://example.com/author5.jpg",
  //   recipient: "LucyVanPelt",
  //   recipientProfilePicture: "https://example.com/recipient5.jpg",
  //   isFollowing: true,
  //   hasLiked: true,
  //   key: "5",
  //   comments: 100,
  //   likes: 50,
  //   image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  //   caption: "City lights.",
  // },
  // {
  //   author: "LucyVanPelt",
  //   authorProfilePicture: "https://example.com/author6.jpg",
  //   recipient: "CharlieBrown",
  //   recipientProfilePicture: "https://example.com/recipient6.jpg",
  //   isFollowing: false,
  //   hasLiked: false,
  //   key: "6",
  //   comments: 100,
  //   likes: 50,
  //   image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  //   caption: "At the beach.",
  // },
  // {
  //   author: "EmilyClark",
  //   authorProfilePicture: "https://example.com/author7.jpg",
  //   recipient: "DavidSmith",
  //   recipientProfilePicture: "https://example.com/recipient7.jpg",
  //   isFollowing: true,
  //   hasLiked: false,
  //   key: "7",
  //   comments: 100,
  //   likes: 50,
  //   image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  //   caption: "Mountain views.",
  // },
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
    caption: "Night out with friends.",
  },
];

const PostItem = ({ item }: { item: DataItem }) => {
  const handleLike = (key: string) => {};
  const handleComment = (key: string) => {};
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );

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
          <View
            flex={4}
            justifyContent="center"
            alignItems="flex-start"
            borderRadius={"$7"}
            backgroundColor={"$gray5"}
          >
            <TouchableOpacity>
              <Text fontWeight={"bold"} padding={"$3"} color={"$gray9"}>
                Comment
              </Text>
            </TouchableOpacity>
          </View>

          <View
            flex={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor={"$gray5"}
            borderRadius={"$7"}
          >
            <TouchableOpacity>
              <Heart size={24} padding={"$3"} color="$gray12" />
            </TouchableOpacity>
          </View>
          <View
            flex={1}
            justifyContent="center"
            alignItems="center"
            backgroundColor={"$gray5"}
            borderRadius={"$7"}
          >
            <TouchableOpacity>
              <Send size={24} padding={"$3"} color="$gray12" />
            </TouchableOpacity>
          </View>
        </XStack>

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
          {/*TODO: Animation to extend this bitch*/}
          <TouchableOpacity>
            <Text
              paddingLeft={"$2"}
              textAlign="center"
              borderBottomLeftRadius={10}
              borderBottomRightRadius={10}
            >
              {item.caption}
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
