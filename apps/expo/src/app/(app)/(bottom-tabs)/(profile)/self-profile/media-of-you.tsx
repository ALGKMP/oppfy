import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Heart, Send } from "@tamagui/lucide-icons";
import { set } from "lodash";
import {
  Avatar,
  Button,
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

interface Comment {
  profilePicture: string;
  username: string;
  timeAgo: string;
  text: string;
}

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
  commentList: Comment[];
}

const data: DataItem[] = [
  {
    author: "JohnDoe",
    authorProfilePicture:
      "https://images.unsplash.com/photo-1603415526960-f7e0328ad5c7",
    recipient: "JaneSmith",
    recipientProfilePicture:
      "https://images.unsplash.com/photo-1555685812-4b74353b4fb9",
    isFollowing: true,
    hasLiked: false,
    key: "1",
    height: 500,
    width: 500,
    comments: 100,
    likes: 50,
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    caption: "Enjoying the sunset!",
    commentList: [
      {
        profilePicture:
          "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
        username: "AliceW",
        timeAgo: "2 hours ago",
        text: "Beautiful view!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1546456073-6712f79251bb",
        username: "BobM",
        timeAgo: "3 hours ago",
        text: "Looks amazing!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
        username: "CharlieK",
        timeAgo: "1 day ago",
        text: "Wish I was there!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
        username: "AliceW",
        timeAgo: "2 hours ago",
        text: "Beautiful view!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1546456073-6712f79251bb",
        username: "BobM",
        timeAgo: "3 hours ago",
        text: "Looks amazing!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
        username: "CharlieK",
        timeAgo: "1 day ago",
        text: "Wish I was there!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
        username: "AliceW",
        timeAgo: "2 hours ago",
        text: "Beautiful view!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1546456073-6712f79251bb",
        username: "BobM",
        timeAgo: "3 hours ago",
        text: "Looks amazing!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
        username: "CharlieK",
        timeAgo: "1 day ago",
        text: "Wish I was there!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1511367461989-f85a21fda167",
        username: "AliceW",
        timeAgo: "2 hours ago",
        text: "Beautiful view!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1546456073-6712f79251bb",
        username: "BobM",
        timeAgo: "3 hours ago",
        text: "Looks amazing!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
        username: "CharlieK",
        timeAgo: "1 day ago",
        text: "Wish I was there!",
      },
    ],
  },
  {
    author: "DavidSmith",
    authorProfilePicture:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12",
    width: 500,
    height: 500,
    recipient: "EmilyClark",
    recipientProfilePicture:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a",
    isFollowing: false,
    hasLiked: true,
    key: "8",
    comments: 100,
    likes: 50,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978",
    caption:
      "Birthday celebrations. fjsdlkf flkj sdjlkas jlkads jklsdaj fsdlkf jsdlksda jlksd jflksdf slkgjweosdjsd  jlksdj lksdfjlsak dfjsdlkf flkj sdjlkas jlkads jklsdaj fsdlkf jsdlksda jlksd jflksdf slkgjweosdjsd  jlksdj lksdfjlsak d",
    commentList: [
      {
        profilePicture:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        username: "DanielleP",
        timeAgo: "4 hours ago",
        text: "Happy Birthday!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9",
        username: "EricB",
        timeAgo: "5 hours ago",
        text: "Looks like fun!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
        username: "FionaG",
        timeAgo: "6 hours ago",
        text: "Amazing celebration!",
      },
    ],
  },
  {
    author: "GraceLee",
    authorProfilePicture:
      "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7",
    recipient: "HenryMiller",
    recipientProfilePicture:
      "https://images.unsplash.com/photo-1520817700543-7db1298ee3b2",
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
    commentList: [
      {
        profilePicture:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        username: "GeorgeH",
        timeAgo: "1 hour ago",
        text: "Great night!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        username: "HannahI",
        timeAgo: "2 hours ago",
        text: "So much fun!",
      },
      {
        profilePicture:
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
        username: "IsaacJ",
        timeAgo: "3 hours ago",
        text: "Miss hanging out with you all!",
      },
    ],
  },
];
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");


const PostItem = ({ item }: { item: DataItem }) => {
  const [status, setStatus] = useState<"success" | "loading" | "error">(
    "success",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [showViewMore, setShowViewMore] = useState(item.caption.length > 100);

  const [isLiked, setIsLiked] = useState(item.hasLiked);
  const [heartColor, setHeartColor] = useState("$gray12"); // Initialize color state
  const [fillHeart, setFillHeart] = useState(false); // Initialize fill state

  // hooks
  const sheetRef = useRef<BottomSheet>(null);
  const innerSheetRef = useRef<BottomSheet>(null);
  // variables
  const data = useMemo(() => item.commentList, []);
  const [modalVisible, setModalVisible] = useState(false);

  const openBottomSheet = () => {
    setModalVisible(true);
    sheetRef.current?.expand();
    innerSheetRef.current?.expand();
  };

  const closeBottomSheet = () => {
    setModalVisible(false);
  };

  const animatedPosition = useSharedValue(0);
  const handleSheetChanges = useCallback((index: number) => {
    console.log("value", animatedPosition.value);
  }, []);

  // Logging function for animated position
  const logPosition = (position: number) => {
    console.log("Animated position:", position);
  };

  // Derived value to monitor and log animatedPosition changes
  useDerivedValue(() => {
    runOnJS(logPosition)(animatedPosition.value);
  }, [animatedPosition.value]);

  const animatedOverlayStyle = useAnimatedStyle(() => {
    // Calculate the percentage height of the screen
    const heightPercentage = animatedPosition.value / screenHeight;

    // Interpolate opacity based on the height percentage
    const opacity = interpolate(
      heightPercentage,
      [0.2, 0.5], // Range of positions in percentage
      [0.8, 0], // Range of opacity values
      "clamp"
    );

    return {
      backgroundColor: `rgba(0, 0, 0, ${opacity})`,
    };
  });

  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <View margin={"$1.5"} padding={"$2.5"}>
        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$4">
            <Avatar.Image accessibilityLabel="Cam" src={item.profilePicture} />
            <Avatar.Fallback backgroundColor="$blue10" />
          </Avatar>
          <YStack gap={"$2"}>
            <XStack gap={"$2"}>
              <Text fontWeight={"bold"}>{item.username}</Text>
              <Text color={"$gray10"}> {item.timeAgo}</Text>
            </XStack>
            <Text>{item.text}</Text>
          </YStack>
        </XStack>
      </View>
    ),
    [],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={24}>
        <View
          style={{
            padding: 12,
            margin: 12,
            borderRadius: 12,
            backgroundColor: "#80f",
          }}
        >
          <BottomSheetTextInput
            style={{
              marginTop: 8,
              marginBottom: 10,
              borderRadius: 10,
              fontSize: 16,
              lineHeight: 20,
              padding: 8,
              backgroundColor: "rgba(151, 151, 151, 0.25)",
            }}
          />

          <Text
            style={{
              textAlign: "center",
              color: "white",
              fontWeight: "800",
            }}
          >
            Footer
          </Text>
        </View>
      </BottomSheetFooter>
    ),
    [],
  );

  // For the fuckin caption
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleComment = (key: string) => {};

  const handleTextLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
  }, []);

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
            <TouchableOpacity onPress={openBottomSheet}>
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
          </TouchableOpacity>
        </View>
      </View>

      {/* Sheet Component */}
      <Modal
        transparent={true}
        // animationType="fade"
        visible={modalVisible}
        onRequestClose={closeBottomSheet}
      >
        <Animated.View
          style={[{ flex: 1}, animatedOverlayStyle]}
        >
          <BottomSheet
            keyboardBehavior="extend"
            ref={sheetRef}
            snapPoints={["65%", "100%"]}
            index={0} // initial state to hide the bottom sheet
            enablePanDownToClose={true}
            onClose={closeBottomSheet}
            onChange={handleSheetChanges}
            animatedPosition={animatedPosition}
            footerComponent={renderFooter}
            containerStyle={{
              backgroundColor: "$gray9",
            }}
          >
            <BottomSheetFlatList
              scrollEnabled={true}
              data={data}
              keyExtractor={(i) => data.indexOf(i).toString()}
              renderItem={renderItem}
              contentContainerStyle={{
                // DO NOT USE FLEX: 1 HERE
                padding: 10,
                backgroundColor: "#282828",
              }}
            />
          </BottomSheet>
        </Animated.View>
      </Modal>
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
