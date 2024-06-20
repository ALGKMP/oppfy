import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Modal, TouchableOpacity } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Minus, SendHorizontal } from "@tamagui/lucide-icons";
import { Avatar, SizableText, Text, View, XStack, YStack } from "tamagui";
import z from "zod";

import { sharedValidators } from "@oppfy/validators";

import { api } from "~/utils/api";

interface CommentsModalProps {
  postId: number;
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
}

const CommentsBottomSheet = ({
  postId,
  modalVisible,
  setModalVisible,
}: CommentsModalProps) => {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%"], []);
  const { height: screenHeight } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const animatedPosition = useSharedValue(0);
  const animatedOverlayStyle = useAnimatedStyle(() => {
    const heightPercentage = animatedPosition.value / screenHeight;
    const opacity = interpolate(
      heightPercentage,
      [0.2, 0.5],
      [0.8, 0],
      "clamp",
    );
    return { backgroundColor: `rgba(0, 0, 0, ${opacity})` };
  });

  const {
    data: commentsData,
    isLoading: isLoadingComments,
    isFetchingNextPage: isFetchingNextPageComments,
    fetchNextPage: fetchNextPageComments,
    hasNextPage: hasNextPageComments,
    refetch: refetchComments,
  } = api.post.paginateComments.useInfiniteQuery(
    {
      postId,
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const addComment = api.post.createComment.useMutation();

  const comments = useMemo(
    () =>
      commentsData?.pages
        .flatMap((page) => page.items ?? [])
        .filter(
          (item): item is z.infer<typeof sharedValidators.media.comment> =>
            item !== undefined,
        ),
    [commentsData],
  );

  const [inputValue, setInputValue] = useState("");

  const emojiList = ["❤️", "🙏", "🔥", "😂", "😭", "😢", "😲", "😍"];
  const handleEmojiPress = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  const renderComment = useCallback(
    ({ item }: { item: z.infer<typeof sharedValidators.media.comment> }) => (
      <View padding={"$3.5"}>
        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$4">
            <Avatar.Image
              accessibilityLabel="Cam"
              src={item.profilePictureUrl}
            />
            <Avatar.Fallback backgroundColor="$blue10" />
          </Avatar>
          <YStack gap={"$2"}>
            <XStack gap={"$2"}>
              <Text fontWeight={"bold"}>{item.username}</Text>
              <Text color={"$gray10"}> {item.createdAt}</Text>
            </XStack>
            <Text>{item.body}</Text>
          </YStack>
        </XStack>
      </View>
    ),
    [],
  );

  const renderHeader = useCallback(
    () => (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
        <Minus size={"$4"} />
        <View justifyContent="center" alignItems="center">
          <SizableText
            size={"$5"}
            textAlign="center"
            color={"$white"}
            fontWeight={"bold"}
          >
            Comments
          </SizableText>
        </View>
        <View
          width={"95%"}
          borderColor={"$gray8"}
          borderWidth={"$0.25"}
          marginTop={"$3"}
        />
      </YStack>
    ),
    [],
  );

  return (
    <>
      <Modal transparent={true} visible={modalVisible}>
        <Animated.View style={[{ flex: 1 }, animatedOverlayStyle]}>
          <BottomSheet
            topInset={insets.top}
            keyboardBehavior="interactive"
            ref={sheetRef}
            snapPoints={snapPoints}
            index={0}
            enablePanDownToClose={true}
            onClose={() => setModalVisible(false)}
            animatedPosition={animatedPosition}
            handleComponent={renderHeader}
            backgroundStyle={{ backgroundColor: "#282828" }}
          >
            {
              // if there are no comments render a message
              comments?.length === 0 ? (
                <View flex={1} justifyContent="center" alignItems="center">
                  <SizableText size={"$7"}>No comments yet</SizableText>
                  <Text color={"$gray10"}>Be the first to comment</Text>
                </View>
              ) : (
                <BottomSheetFlatList
                  scrollEnabled={true}
                  data={comments ?? []}
                  keyExtractor={(i) => i.commentId.toString()}
                  renderItem={renderComment}
                  contentContainerStyle={{ backgroundColor: "#282828" }}
                />
              )
            }
            <XStack
              borderTopColor={"$gray5"}
              borderTopWidth={"$0.25"}
              justifyContent="space-evenly"
              alignItems="center"
              paddingTop={"$3"}
              backgroundColor={"$gray4"}
            >
              {emojiList.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleEmojiPress(emoji)}
                >
                  <SizableText size={"$8"}>{emoji}</SizableText>
                </TouchableOpacity>
              ))}
            </XStack>
            <XStack
              padding={"$3.5"}
              paddingBottom={"$6"}
              gap="$2.5"
              justifyContent="center"
              alignItems="center"
              backgroundColor={"$gray4"}
            >
              <Avatar circular size="$4" flex={1}>
                <Avatar.Image
                  accessibilityLabel="User Avatar"
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9"
                />
                <Avatar.Fallback backgroundColor="$blue10" />
              </Avatar>
              <View style={{ flex: 5 }}>
                <BottomSheetTextInput
                  placeholder="Comment"
                  maxLength={100}
                  value={inputValue}
                  focusable={true}
                  onChangeText={setInputValue}
                  style={{
                    fontWeight: "bold",
                    justifyContent: "flex-start",
                    borderWidth: 10,
                    borderColor: "#2E2E2E",
                    borderRadius: 20,
                    backgroundColor: "#2E2E2E",
                    color: "#fff",
                    flex: 2,
                  }}
                />
              </View>
              <View
                flex={1}
                justifyContent="center"
                alignItems="center"
                padding="$2"
                borderRadius={"$7"}
                backgroundColor={"$blue9"}
              >
                <TouchableOpacity
                  onPress={() => {
                    console.log("test test test ");
                  }}
                >
                  <SendHorizontal color="$gray12" />
                </TouchableOpacity>
              </View>
            </XStack>
          </BottomSheet>
        </Animated.View>
      </Modal>
    </>
  );
};

export default CommentsBottomSheet;
