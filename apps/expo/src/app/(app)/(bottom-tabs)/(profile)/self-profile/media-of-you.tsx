import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  TouchableOpacity,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { Heart, Send } from "@tamagui/lucide-icons";
import {
  Avatar,
  Separator,
  Sheet,
  SheetProps,
  SizableText,
  Text,
  TextArea,
  View,
  XStack,
  YStack,
} from "tamagui";

// import { BaseScreenView, KeyboardSafeView } from "~/components/Views";

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
    caption:
      "Birthday celebrations. fjsdlkf flkj sdjlkas jlkads jklsdaj fsdlkf jsdlksda jlksd jflksdf slkgjweosdjsd  jlksdj lksdfjlsak dfjsdlkf flkj sdjlkas jlkads jklsdaj fsdlkf jsdlksda jlksd jflksdf slkgjweosdjsd  jlksdj lksdfjlsak d",
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
    caption:
      "Night out with friends fjsdklfjsdklfjsldk sdljkfsd jlksd jflksd jsldkj fsklsdj kwefjiosldjfwo0isjfoiw  fjsdklfjasdlk fsdalkjfasd fasldkf sdalkfsad lkfa jsadjf sdlakasdf hello world.",
  },
];

const PostItem = ({ item }: { item: DataItem }) => {
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );
  const [fullTextHeight, setFullTextHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewMore, setShowViewMore] = useState(item.caption.length > 100);

  const [isLiked, setIsLiked] = useState(item.hasLiked);
  const [heartColor, setHeartColor] = useState("$gray12"); // Initialize color state
  const [fillHeart, setFillHeart] = useState(false); // Initialize fill state

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetPosition, setSheetPosition] = useState(0);

  const handleOpenSheet = () => {
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };
  // For the fuckin caption
  const maxHeight = useSharedValue(50); // This sets the initial collapsed height

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    maxHeight.value = withTiming(isExpanded ? 50 : 100, {
      duration: 300,
    });
  };

  const handleComment = (key: string) => {};

  const handleTextLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    console.log(height);
    setFullTextHeight(height);
  }, []);

  const maskAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: maxHeight.value,
    };
  });

  const renderCaption = () => {
    const maxLength = 100; // Set max length for the caption
    if (item.caption.length <= maxLength || isExpanded) {
      return item.caption;
    }
    return `${item.caption.substring(0, maxLength)}...`;
  };

  // For the fuckin like button
  const imageLikeScale = useSharedValue(0);
  // const opacity = useSharedValue(1);
  const buttonLikeScale = useSharedValue(1);

  const handleImageLikeAnimation = () => {
    imageLikeScale.value = withSpring(
      1,
      {
        duration: 400,
        dampingRatio: 0.5,
        stiffness: 50,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        imageLikeScale.value = withDelay(150, withTiming(0, { duration: 250 }));
      },
    );
    // opacity.value = withTiming(1, { duration: 200 }, () => {
    // opacity.value = withTiming(0, { duration: 200 });
    // });
    setIsLiked(true); // Update the liked state
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleImageLikeAnimation)();
    });

  const heartImageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: imageLikeScale.value }],
      // opacity: opacity.value,
    };
  });

  const heartButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonLikeScale.value }],
      // opacity: opacity.value,
    };
  });

  const handleButtonLikeAnimation = () => {
    buttonLikeScale.value = withSpring(
      1.1,
      {
        duration: 100,
        dampingRatio: 0.5,
        stiffness: 50,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 2,
        reduceMotion: ReduceMotion.System,
      },
      () => {
        buttonLikeScale.value = withTiming(1, { duration: 200 });
      },
    );
    setIsLiked(!isLiked);
    setFillHeart(!fillHeart); // Toggle fill state
    setHeartColor(heartColor === "$gray12" ? "red" : "$gray12"); // Toggle heart color
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
      <GestureDetector gesture={doubleTap}>
        <Image
          source={{ uri: item.image }}
          style={[
            {
              width: item.width,
              height: item.height,
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
          // contentFit="contain"
        >
          <Animated.View style={[heartImageAnimatedStyle]}>
            <Heart size={100} color={"red"} fill={"red"} />
          </Animated.View>
        </Image>
      </GestureDetector>
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

      {/* Under Post */}
      <View
        flex={1}
        alignSelf={"stretch"}
        padding={"$2"}
        paddingTop={"$3"}
        borderBottomRightRadius={"$8"}
        borderBottomLeftRadius={"$8"}
        backgroundColor={"$gray2"}
        marginBottom={"$5"}
      >
        <XStack gap={"$2"} alignItems="flex-start">
          {/* Comment Button */}
          <View flex={4} justifyContent="center">
            <TouchableOpacity onPress={handleOpenSheet}>
              <View
                flex={1}
                justifyContent="flex-start"
                padding={"$2.5"}
                borderRadius={"$7"}
                backgroundColor={"$gray5"}
              >
                <Text fontWeight={"bold"} color={"$gray9"}>
                  Comment
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Like Button */}
          <View flex={1} justifyContent="center">
            <TouchableOpacity
              onPress={handleButtonLikeAnimation}
              // activeOpacity={1} // Uncomment this line to disable the opacity change on press
            >
              <View
                justifyContent="center"
                alignItems="center"
                borderRadius={"$7"}
                padding={"$2"}
                backgroundColor={"$gray5"}
              >
                <Animated.View style={[heartButtonAnimatedStyle]}>
                  <Heart
                    size={24}
                    padding={"$3"}
                    color={heartColor}
                    fill={"red"}
                    fillOpacity={fillHeart ? 1 : 0}
                  />
                </Animated.View>
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
            <TouchableOpacity>
              <SizableText size={"$2"} fontWeight={"bold"} color={"$gray10"}>
                102 other comments
              </SizableText>
            </TouchableOpacity>
          </View>
          <View flex={2} alignItems={"flex-start"}>
            <TouchableOpacity>
              <SizableText size={"$2"} fontWeight={"bold"} color={"$gray10"}>
                1k likes
              </SizableText>
            </TouchableOpacity>
          </View>
        </XStack>

        {/* Caption */}
        <View flex={1} alignItems="flex-start" padding="$2">
          <TouchableOpacity onPress={toggleExpanded}>
            {/* <Animated.View
                style={[
                  maskAnimatedStyle,
                  { overflow: "hidden", flexDirection: "row" },
                ]}
              > */}
            <Text
              numberOfLines={isExpanded ? 0 : 2}
              onLayout={handleTextLayout}
            >
              {renderCaption()}
              {showViewMore && !isExpanded ? (
                <Text color={"$gray10"}> more</Text>
              ) : (
                ""
              )}
            </Text>
            {/* </Animated.View> */}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sheet Component */}
        <Sheet
          open={isSheetOpen}
          onOpenChange={handleCloseSheet}
          animation="medium"
          modal
          snapPoints={[10, 100]}
          dismissOnSnapToBottom
          moveOnKeyboardChange
        >
          <Sheet.Frame>
            <Text>Text</Text>
            <TextArea
              flex={1}
              alignSelf="stretch"
              justifyContent="center"
              lineHeight={0}
              alignItems="flex-start"
              padding={"$2.5"}
              borderRadius={"$7"}
              backgroundColor={"$gray5"}
              placeholder="Write your comment..."
              placeholderTextColor={"$gray9"}
              fontWeight={"bold"}
              borderWidth={0}
              selectionColor={"transparent"}
              maxLength={100}
              // Add any additional props here
            />
          </Sheet.Frame>
        </Sheet>
      <Sheet
        open={isSheetOpen}
        onOpenChange={handleCloseSheet}
        onPositionChange={setSheetPosition}
        position={sheetPosition}
        forceRemoveScrollEnabled={isSheetOpen}
        modal
        dismissOnSnapToBottom
        snapPointsMode="percent"
        snapPoints={[80, 50]}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Handle opacity={1} backgroundColor={"$gray5"} />
        {/* <Sheet.ScrollView> */}
        <Sheet.Frame
          flex={4}
          padding="$4"
          justifyContent="center"
          alignItems="center"
          gap="$5"
        >
          <YStack flex={1} margin={"$3"} objectFit="fill">
            <XStack flex={9}>
              <Text>This area is for comments</Text>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
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
