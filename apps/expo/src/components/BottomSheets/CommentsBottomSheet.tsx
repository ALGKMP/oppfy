import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, Modal, TouchableOpacity } from "react-native";
import { panGestureHandlerCustomNativeProps } from "react-native-gesture-handler/lib/typescript/handlers/PanGestureHandler";
import Animated, {
  BounceIn,
  BounceInDown,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import {
  AlertCircle,
  Minus,
  SendHorizontal,
  Trash2,
} from "@tamagui/lucide-icons";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { Avatar, SizableText, Text, View, XStack, YStack } from "tamagui";
import z from "zod";

import { sharedValidators } from "@oppfy/validators";

import { api } from "~/utils/api";
import { BlurContextMenuWrapper } from "../ContextMenu";
import ReportCommentActionSheet from "~/components/Sheets/ReportCommentActionSheet";

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
  const utils = api.useUtils();
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
  const [optimisticUpdateCommentId, setOptimisticUpdateCommentId] = useState<
    number | null
  >(null);

  const profile = utils.profile.getFullProfileSelf.getData();

  const openModal = useCallback(() => {
    sheetRef.current?.expand();
  }, [sheetRef]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    sheetRef.current?.close();
  }, [sheetRef]);

  useEffect(() => {
    if (modalVisible) {
      openModal();
    } else {
      closeModal();
    }
  }, [modalVisible]);

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
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const commentOnPost = api.post.createComment.useMutation({
    onMutate: async (newComment) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await utils.post.paginateComments.cancel();

      const temporaryId = Math.random();
      setOptimisticUpdateCommentId(temporaryId);

      // Snapshot the previous value
      const prevData = utils.post.paginateComments.getInfiniteData();

      // Optimistically update to the new value
      utils.post.paginateComments.setInfiniteData({ postId }, (prevData) => {
        if (!prevData) return { pages: [], pageParams: [] };
        return {
          ...prevData,
          pages: prevData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                items: [
                  {
                    ...newComment,
                    username: profile?.username ?? "User",
                    createdAt: new Date(),
                    userId: profile?.userId ?? "temp-id",
                    commentId: temporaryId, // Temporary ID
                    profilePictureUrl:
                      profile?.profilePictureUrl ??
                      "https://example.com/avatar.jpg",
                  },
                  ...page.items,
                ],
              };
            }
            return page;
          }),
        };
      });

      // Return a context object with the snapshotted value
      return { prevData };
    },
    onError: (err, _newData, ctx) => {
      // Rollback to the previous value on error
      console.log(err);
      if (ctx?.prevData) {
        utils.post.paginateComments.setInfiniteData({ postId }, ctx.prevData);
      }
    },
    onSettled: () => {
      // Sync with server once mutation has settled
      utils.post.paginateComments.invalidate();
      setOptimisticUpdateCommentId(null); // Reset new comment ID after server sync
    },
  });

  const handlePostComment = async () => {
    if (inputValue.trim().length === 0) {
      return;
    }

    const newComment = {
      postId,
      body: inputValue.trim(),
    };

    setInputValue(""); // Clear the input field

    await commentOnPost.mutateAsync(newComment);
  };

  const comments = useMemo(
    () =>
      commentsData?.pages
        .flatMap((page) => page.items ?? [])
        .filter(
          (item): item is z.infer<typeof sharedValidators.media.comment> =>
            item !== undefined,
        ) ?? [],
    [commentsData],
  );

  const [inputValue, setInputValue] = useState("");

  const emojiList = ["❤️", "🙏", "🔥", "😂", "😭", "😢", "😲", "😍"];
  const handleEmojiPress = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  TimeAgo.addLocale(en);
  const timeAgo = new TimeAgo("en-US");

  const Comment = useCallback(
    ({
      item,
      isNew = false,
    }: {
      item: z.infer<typeof sharedValidators.media.comment>;
      isNew?: boolean;
    }) => {
      const [isReportModalVisible, setIsReportModalVisible] = useState(false);

      return (
        <BlurContextMenuWrapper
          options={[
            {
              label: (
                <Text color="white" marginLeft="$2" fontSize="$5">
                  Delete
                </Text>
              ),
              icon: <Trash2 size={"$1.5"} color="white" />,
              onPress: () => {
                console.log("Delete");
              },
            },
            {
              label: (
                <Text color="red" marginLeft="$2" fontSize="$5">
                  Report
                </Text>
              ),
              icon: <AlertCircle size={"$1.5"} color="red" />,
              onPress: () => {
                setTimeout(() => {
                  setIsReportModalVisible(true);
                }, 275);
              },
            },
          ]}
        >
          <View padding={"$3.5"} backgroundColor={"$gray4"} borderRadius={"$7"}>
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
                  <Text color={"$gray10"}>
                    {timeAgo.format(new Date(item.createdAt))}
                  </Text>
                </XStack>
                <Text>{item.body}</Text>
              </YStack>
            </XStack>
          </View>
          <ReportCommentActionSheet
            title="Report Comment"
            subtitle="Select reason"
            commentId={item.commentId}
            isVisible={isReportModalVisible}
            onCancel={() => setIsReportModalVisible(false)}
          />
        </BlurContextMenuWrapper>
      );
    },
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
    <Modal transparent={true} visible={modalVisible}>
      <Animated.View style={[{ flex: 1 }, animatedOverlayStyle]}>
        <BottomSheet
          topInset={insets.top}
          keyboardBehavior="interactive"
          ref={sheetRef}
          snapPoints={snapPoints}
          index={0}
          enablePanDownToClose={true}
          onClose={() => {
            closeModal();
          }}
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
                onEndReached={async () => {
                  await fetchNextPageComments();
                }}
                scrollEnabled={true}
                data={comments ?? []}
                renderItem={({ item }) => (
                  <Comment
                    item={item}
                    isNew={item.commentId === optimisticUpdateCommentId}
                  />
                )}
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
                src={profile?.profilePictureUrl}
              />
              <Avatar.Fallback backgroundColor="$blue10" />
            </Avatar>
            <View style={{ flex: 5 }}>
              <BottomSheetTextInput
                placeholder="Comment"
                maxLength={100}
                value={inputValue}
                onChangeText={setInputValue}
                style={{
                  fontWeight: "bold",
                  justifyContent: "flex-start",
                  borderWidth: 10,
                  borderColor: "#2E2E2E",
                  borderRadius: 20,
                  backgroundColor: "#2E2E2E",
                  color: "#fff",
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
              <TouchableOpacity onPress={handlePostComment}>
                <SendHorizontal color="$gray12" />
              </TouchableOpacity>
            </View>
          </XStack>
        </BottomSheet>
      </Animated.View>
    </Modal>
  );
};

export default CommentsBottomSheet;
