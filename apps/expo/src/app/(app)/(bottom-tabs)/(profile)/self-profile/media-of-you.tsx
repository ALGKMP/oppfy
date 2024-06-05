import React, { useState } from "react";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import { SharedValue, withSpring } from "react-native-reanimated";
import { Image } from "expo-image";
import { FontAwesome } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Heart, MessageCircle } from "@tamagui/lucide-icons";
import {
  Avatar,
  Separator,
  SizableText,
  Stack,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

// import { api } from "@oppfy/utils";

const { width: screenWidth } = Dimensions.get("window");

type DataItem = {
  author: string;
  authorProfilePicture: string;
  recipient: string;
  recipientProfilePicture: string;

  isFollowing: boolean;
  hasLiked: boolean;

  key: string;
  comments: number;
  likes: number;
  image: string;
  caption: string;
};

const data = [
  {
    author: "JohnDoe",
    authorProfilePicture:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    recipient: "JaneSmith",
    recipientProfilePicture: "https://example.com/recipient1.jpg",
    isFollowing: true,
    hasLiked: false,
    key: "1",
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
    key: "9",
    comments: 100,
    likes: 50,
    image: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0",
    caption: "Night out with friends.",
  },
];

const MediaOfYou = () => {
  const handleLike = (key: string) => {};

  const handleComment = (key: string) => {};

  const renderItem = ({ item }: { item: DataItem }) => (
    <View
      flex={1}
      alignItems="center"
      justifyContent="center"
      marginBottom={50}
      maxHeight={550}
      width={"100%"}
    >
      <Image source={{ uri: item.image }} style={styles.image}>
        <XStack
          marginTop={"$3"}
          marginLeft={"$3"}
          justifyContent="flex-start"
          alignContent="center"
          gap={"$3"}
        >
          <Avatar circular size="$5">
            <Avatar.Image
              accessibilityLabel="Cam"
              src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
            />
            <Avatar.Fallback backgroundColor="$blue10" />
          </Avatar>
          <YStack paddingTop={"$2"}>
            <SizableText
              shadowRadius={3}
              shadowOpacity={0.5}
              size={"$3"}
              fontWeight={"bold"}
            >
              @AuthorUsername
            </SizableText>
            <XStack flex={1} gap={"$1"} alignItems="center">
              <SizableText height={35} lineHeight={"$2"}>
                📸
              </SizableText>
              <SizableText
                height={35}
                size={"$2"}
                // color={"grey"}
                fontWeight={"bold"}
                color={"$gray2"}
                // shadowOpacity={100}
              >
                posted by:
              </SizableText>
              <SizableText
                height={35}
                size={"$2"}
                fontWeight={"bold"}
                color={"$blue9"}
              >
                @RecipientUsername
              </SizableText>
            </XStack>
          </YStack>
        </XStack>
        <YStack
          gap="$2"
          position="absolute"
          bottom={20}
          right={20}
          // paddingBottom={40}
        >
          <View
            flex={1}
            alignItems="center"
            // marginBottom={8}
          >
            <TouchableOpacity onPress={() => handleLike(item.key)} />
            <Heart size={24} color="white" />
            <Text
              // marginTop={5}
              color="#fff"
            >
              {item.likes}
            </Text>
          </View>
          <View
            flex={1}
            alignItems="center"
            // marginBottom={8}
          >
            <TouchableOpacity onPress={() => handleComment(item.key)} />
            <MessageCircle
              borderBlockWidth={1}
              borderColor={"black"}
              size={24}
              color="white"
            />
            <Text
              // marginTop={3}
              color="#fff"
            >
              {item.comments}
            </Text>
          </View>
        </YStack>
      </Image>
      {/* <Text
        color="#fff"
        textAlign="center"
        borderBottomLeftRadius={10}
        borderBottomRightRadius={10}
        // marginTop={20}
      >
        {item.caption}
      </Text> */}
    </View>
  );

  return (
    <View flex={1}>
      {/* <Separator
        // margin={10}
        borderColor={"white"}
        height={50}
      /> */}
      <FlashList
        data={data}
        numColumns={1}
        renderItem={renderItem}
        estimatedItemSize={screenWidth}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
    borderRadius: 10,
  },
});

export default MediaOfYou;
