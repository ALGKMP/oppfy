import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TouchableOpacity } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetFlatList,
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
import { input } from "node_modules/@oppfy/validators/src/trpc";
import {
  Avatar,
  SizableText,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import type z from "zod";

import type { sharedValidators } from "@oppfy/validators";

import ReportCommentActionSheet from "~/components/Sheets/ReportCommentActionSheet";
import { api } from "~/utils/api";
import { BlurContextMenuWrapper } from "../ContextMenu";
import BottomSheetWrapper from "./BottomSheetWrapper";

interface CommentsModalProps {
  postId: number;
  userIdOfPostRecipient: string;
  isSelfPost: boolean;
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
}

type Comment = z.infer<typeof sharedValidators.media.comment>;

const CommentsBottomSheet = React.memo(
  ({
    postId,
    userIdOfPostRecipient,
    isSelfPost,
    modalVisible,
    setModalVisible,
  }: CommentsModalProps) => {
    console.log("RE-RENDERING THIS BITCH ASS CommentsBottomSheet");
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const utils = api.useUtils();
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["100%"], []);
    const insets = useSafeAreaInsets();

    const profile = utils.profile.getFullProfileSelf.getData();

    const openModal = useCallback(() => {
      sheetRef.current?.expand();
    }, [sheetRef]);

    const closeModal = useCallback(() => {
      setModalVisible(false);
      sheetRef.current?.close();
    }, [sheetRef, setModalVisible]);

    useEffect(() => {
      if (modalVisible) {
        openModal();
      } else {
        closeModal();
      }
    }, [modalVisible, closeModal, openModal]);

    const {
      data: commentsData,
      isLoading: commentsLoading,
      isFetchingNextPage,
      fetchNextPage,
      hasNextPage,
      refetch,
    } = api.post.paginateComments.useInfiniteQuery(
      {
        postId,
        pageSize: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

    const renderHeader = useCallback(
      () => (
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          position="relative"
        >
          <Text>
            {commentsData?.pages.length}{" "}
            {commentsData?.pages.length === 1 ? "Comment" : "Comments"}
          </Text>
          <Minus size="$4" />
          <View justifyContent="center" alignItems="center">
            <SizableText
              size="$5"
              textAlign="center"
              color="$white"
              fontWeight="bold"
            >
              Comments
            </SizableText>
          </View>
          <View
            width="95%"
            borderColor="$gray8"
            borderWidth="$0.25"
            marginTop="$3"
          />
        </YStack>
      ),
      [],
    );

    return (
      <BottomSheetWrapper
        sheetRef={sheetRef}
        modalVisible={modalVisible}
        onClose={closeModal}
        onOpen={openModal}
        snapPoints={snapPoints}
        topInset={insets.top}
        handleComponent={renderHeader}
      >
        <CommentInput
          postId={postId}
          profile={profile}
          isSelfPost={isSelfPost}
          userIdOfPostRecipient={userIdOfPostRecipient}
        />
      </BottomSheetWrapper>
    );
  },
  (prevProps, nextProps) => {
    console.log("prevProps", prevProps);
    console.log("nextProps", nextProps);
    return (
      prevProps.postId === nextProps.postId &&
      prevProps.modalVisible === nextProps.modalVisible
    );
  },
);


interface CommentInputProps {
  isSelfPost: boolean;
  postId: number;
  profile: any;
  userIdOfPostRecipient: string;
}

const CommentInput: React.FC<CommentInputProps> = React.memo(
  ({ isSelfPost, postId, userIdOfPostRecipient, profile }) => {
    const [inputValue, setInputValue] = useState("");

    const handleChangeText = useCallback((text: string) => {
      setInputValue(text);
    }, []);

    const emojiList = ["❤️", "🙏", "🔥", "😂", "😭", "😢", "😲", "😍"];
    const handleEmojiPress = useCallback((emoji: string) => {
      setInputValue((prev) => prev + emoji);
    }, []);

    const utils = api.useUtils();

    const commentOnPost = api.post.createComment.useMutation({
      onMutate: async (newComment) => {
        // Cancel any outgoing refetches to avoid overwriting optimistic update
        console.log("Running onMutate");
        await utils.post.paginateComments.cancel({ postId, pageSize: 10 });
        // if (isSelfPost) {
        //   await utils.post.paginatePostsOfUserSelf.cancel({ pageSize: 10 });
        // } else {
        //   await utils.post.paginatePostsOfUserOther.cancel({
        //     userId: userIdOfPostRecipient,
        //     pageSize: 10,
        //   });
        // }

        // Snapshot the previous value
        const prevCommentsData = utils.post.paginateComments.getInfiniteData({
          postId,
          pageSize: 10,
        });
        // const prevPostsData = isSelfPost
        //   ? utils.post.paginatePostsOfUserSelf.getInfiniteData({
        //       pageSize: 10,
        //     })
        //   : utils.post.paginatePostsOfUserOther.getInfiniteData({
        //       userId: userIdOfPostRecipient,
        //       pageSize: 10,
        //     });

        // if (isSelfPost) {
        //   utils.post.paginatePostsOfUserSelf.setInfiniteData(
        //     { pageSize: 10 },
        //     (prevData) => {
        //       if (!prevData) return prevData;
        //       return {
        //         ...prevData,
        //         pages: prevData.pages.map((page) => {
        //           // check if it's postId
        //           page.items.map((item) => {
        //             if (item?.postId === postId) {
        //               console.log("adding extra count");
        //               item.commentsCount += 1;
        //             }
        //           });
        //           return page;
        //         }),
        //       };
        //     },
        //   );
        // } else {
        //   utils.post.paginatePostsOfUserOther.setInfiniteData(
        //     { userId: userIdOfPostRecipient, pageSize: 10 },
        //     (prevData) => {
        //       if (!prevData) return prevData;
        //       return {
        //         ...prevData,
        //         pages: prevData.pages.map((page) => {
        //           // check if it's postId
        //           page.items.map((item) => {
        //             if (item?.postId === postId) {
        //               console.log("adding extra count");
        //               item.commentsCount += 1;
        //             }
        //           });
        //           return page;
        //         }),
        //       };
        //     },
        //   );
        // }

        const temporaryId = Math.random();

        // Optimistically update to the new value
        utils.post.paginateComments.setInfiniteData(
          { postId, pageSize: 10 },
          (prevData) => {
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
          },
        );
        // Return a context object with the snapshotted value
        // return { prevCommentsData, prevPostsData };
        return { prevCommentsData}
      },
      onError: (err, _newData, ctx) => {
        // Rollback to the previous value on error
        console.log(err);
        if (ctx?.prevCommentsData) {
          utils.post.paginateComments.setInfiniteData(
            { postId, pageSize: 10 },
            ctx.prevCommentsData,
          );
        }
        // if (ctx?.prevPostsData) {
        //   if (isSelfPost) {
        //     utils.post.paginatePostsOfUserSelf.setInfiniteData(
        //       { pageSize: 10 },
        //       ctx.prevPostsData,
        //     );
        //   } else {
        //     utils.post.paginatePostsOfUserOther.setInfiniteData(
        //       { userId: userIdOfPostRecipient, pageSize: 10 },
        //       ctx.prevPostsData,
        //     );
        //   }
        // }
      },
      // onSettled: async () => {
      //   await utils.post.paginateComments.invalidate({ postId, pageSize: 10 });
      // },
    });

    const commentOnPostWithoutExtraShit = api.post.createComment.useMutation();

    const handlePostComment = useCallback(async () => {
      if (inputValue.trim().length === 0) return;
      const newComment = {
        postId,
        body: inputValue,
      };
      setInputValue("");
      // await commentOnPostWithoutExtraShit.mutateAsync(newComment);
      await commentOnPost.mutateAsync(newComment);
    }, [inputValue, postId, commentOnPost]);

    return (
      <>
        <XStack
          borderTopColor="$gray5"
          borderTopWidth="$0.25"
          justifyContent="space-evenly"
          alignItems="center"
          paddingTop="$3"
          backgroundColor="$gray4"
        >
          {emojiList.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => handleEmojiPress(emoji)}
            >
              <SizableText size="$8">{emoji}</SizableText>
            </TouchableOpacity>
          ))}
        </XStack>
        <XStack
          padding="$3.5"
          paddingBottom="$6"
          gap="$2.5"
          justifyContent="center"
          alignItems="center"
          backgroundColor="$gray4"
        >
          <MemoizedAvatar src={profile?.profilePictureUrl} />
          <View style={{ flex: 5 }}>
            <BottomSheetTextInput
              placeholder="add a comment..."
              maxLength={100}
              value={inputValue}
              numberOfLines={4}
              onChangeText={handleChangeText}
              style={{
                fontWeight: "normal",
                justifyContent: "flex-start",
                borderWidth: 10,
                borderColor: "#2E2E2E",
                borderRadius: 20,
                backgroundColor: "#2E2E2E",
                color: "#fff",
              }}
            />
          </View>
          <TouchableOpacity
            onPress={handlePostComment}
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 7,
              backgroundColor: "rgb(1,145,255)",
              borderRadius: 20,
              borderWidth: 0,
            }}
          >
            <SendHorizontal color="$gray12" />
          </TouchableOpacity>
        </XStack>
      </>
    );
  },
);

const MemoizedAvatar = React.memo(({ src }: { src: string }) => (
  <Avatar circular size="$4" flex={1}>
    <Avatar.Image accessibilityLabel="User Avatar" src={src} />
    <Avatar.Fallback backgroundColor="$blue10" />
  </Avatar>
));

export default CommentsBottomSheet;
