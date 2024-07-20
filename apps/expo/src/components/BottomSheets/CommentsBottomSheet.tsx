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
import BottomSheet, { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  AlertCircle,
  Minus,
  SendHorizontal,
  Trash2,
} from "@tamagui/lucide-icons";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
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

import SelfProfile from "~/app/(app)/(bottom-tabs)/(profile)/self-profile";
import ReportCommentActionSheet from "~/components/Sheets/ReportCommentActionSheet";
import { api } from "~/utils/api";
import { BlurContextMenuWrapper } from "../ContextMenu";
import BottomSheetWrapper from "./BottomSheetWrapper";

interface CommentsModalProps {
  postId: number;
  profileIdOfPostRecipient: number;
  isSelfPost: boolean;
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
}

const CommentsBottomSheet = ({
  postId,
  profileIdOfPostRecipient,
  isSelfPost,
  modalVisible,
  setModalVisible,
}: CommentsModalProps) => {
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

  const commentOnPost = api.post.createComment.useMutation({
    onMutate: async (newComment) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await utils.post.paginateComments.cancel();
      if (isSelfPost) {
        await utils.post.paginatePostsOfUserSelf.cancel();
      } else {
        await utils.post.paginatePostsOfUserOther.cancel();
      }

      const temporaryId = Math.random();

      // Snapshot the previous value
      const prevCommentsData = utils.post.paginateComments.getInfiniteData();
      const prevPostsData = isSelfPost
        ? utils.post.paginatePostsOfUserSelf.getInfiniteData({
            pageSize: 10,
          })
        : utils.post.paginatePostsOfUserOther.getInfiniteData({
            profileId: profileIdOfPostRecipient,
            pageSize: 10,
          });

      if (isSelfPost) {
        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          { pageSize: 10 },
          (prevData) => {
            if (!prevData) return prevData;
            return {
              ...prevData,
              pages: prevData.pages.map((page, index) => {
                // check if it's postId
                page.items.map((item) => {
                  if (item?.postId === postId) {
                    console.log("adding extra count");
                    item.commentsCount += 1;
                  }
                });
                return page;
              }),
            };
          },
        );
      } else {
        utils.post.paginatePostsOfUserOther.setInfiniteData(
          { profileId: profileIdOfPostRecipient, pageSize: 10 },
          (prevData) => {
            if (!prevData) return prevData;
            return {
              ...prevData,
              pages: prevData.pages.map((page, index) => {
                // check if it's postId
                page.items.map((item) => {
                  if (item?.postId === postId) {
                    console.log("adding extra count");
                    item.commentsCount += 1;
                  }
                });
                return page;
              }),
            };
          },
        );
      }

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
      return { prevCommentsData, prevPostsData };
    },
    onError: (err, _newData, ctx) => {
      // Rollback to the previous value on error
      console.log(err);
      if (ctx?.prevCommentsData) {
        utils.post.paginateComments.setInfiniteData(
          { postId },
          ctx.prevCommentsData,
        );
      }
      if (ctx?.prevPostsData) {
        if (isSelfPost) {
          utils.post.paginatePostsOfUserSelf.setInfiniteData(
            { pageSize: 10 },
            ctx.prevPostsData,
          );
        } else {
          utils.post.paginatePostsOfUserOther.setInfiniteData(
            { profileId: profileIdOfPostRecipient, pageSize: 10 },
            ctx.prevPostsData,
          );
        }
      }
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.paginateComments.invalidate();
    },
  });

  const deleteComment = api.post.deleteComment.useMutation({
    onMutate: async (newComment) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await utils.post.paginateComments.cancel();
      if (isSelfPost) {
        await utils.post.paginatePostsOfUserSelf.cancel();
      } else {
        await utils.post.paginatePostsOfUserOther.cancel();
      }

      // Snapshot the previous value
      const prevCommentsData = utils.post.paginateComments.getInfiniteData();
      const prevPostsData = isSelfPost
        ? utils.post.paginatePostsOfUserSelf.getInfiniteData({
            pageSize: 10,
          })
        : utils.post.paginatePostsOfUserOther.getInfiniteData({
            profileId: profileIdOfPostRecipient,
            pageSize: 10,
          });

      if (isSelfPost) {
        utils.post.paginatePostsOfUserSelf.setInfiniteData(
          { pageSize: 10 },
          (prevData) => {
            if (!prevData) return prevData;
            return {
              ...prevData,
              pages: prevData.pages.map((page) => {
                page.items.map((item) => {
                  if (item?.postId === postId) {
                    item.commentsCount -= 1;
                  }
                });
                return page;
              }),
            };
          },
        );
      } else {
        utils.post.paginatePostsOfUserOther.setInfiniteData(
          { profileId: profileIdOfPostRecipient, pageSize: 10 },
          (prevData) => {
            if (!prevData) return prevData;
            return {
              ...prevData,
              pages: prevData.pages.map((page) => {
                page.items.map((item) => {
                  if (item?.postId === postId) {
                    item.commentsCount -= 1;
                  }
                });
                return page;
              }),
            };
          },
        );
      }

      // Optimistically update to the new value
      utils.post.paginateComments.setInfiniteData({ postId }, (prevData) => {
        if (!prevData) return { pages: [], pageParams: [] };
        return {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
              (item) => item?.commentId !== newComment.commentId,
            ),
          })),
        };
      });

      // Return a context object with the snapshotted value
      return { prevCommentsData, prevPostsData };
    },
    onError: (err, _newData, ctx) => {
      // Rollback to the previous value on error
      console.log(err);
      if (ctx?.prevCommentsData) {
        utils.post.paginateComments.setInfiniteData(
          { postId },
          ctx.prevCommentsData,
        );
      }
      if (ctx?.prevPostsData) {
        if (isSelfPost) {
          utils.post.paginatePostsOfUserSelf.setInfiniteData(
            { pageSize: 10 },
            ctx.prevPostsData,
          );
        } else {
          utils.post.paginatePostsOfUserOther.setInfiniteData(
            { profileId: profileIdOfPostRecipient, pageSize: 10 },
            ctx.prevPostsData,
          );
        }
      }
    },
    onSettled: async () => {
      // Sync with server once mutation has settled
      await utils.post.paginateComments.invalidate();
      if (isSelfPost) {
        await utils.post.paginatePostsOfUserSelf.invalidate();
      } else {
        await utils.post.paginatePostsOfUserOther.invalidate();
      }
    },
  });

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

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
        .flatMap((page) => page.items)
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

  const Comment = ({
    comment,
  }: {
    comment: z.infer<typeof sharedValidators.media.comment>;
  }) => {
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);

    return (
      <BlurContextMenuWrapper
        options={
          isSelfPost || comment.userId === profile?.userId
            ? [
                {
                  label: (
                    <Text color="white" marginLeft="$2" fontSize="$5">
                      Delete
                    </Text>
                  ),
                  icon: <Trash2 size="$1.5" color="white" />,
                  onPress: () =>
                    void deleteComment.mutateAsync({
                      postId,
                      commentId: comment.commentId,
                    }),
                },
                {
                  label: (
                    <Text color="red" marginLeft="$2" fontSize="$5">
                      Report
                    </Text>
                  ),
                  icon: <AlertCircle size="$1.5" color="red" />,
                  onPress: () => {
                    setTimeout(() => {
                      setIsReportModalVisible(true);
                    }, 275);
                  },
                },
              ]
            : [
                {
                  label: (
                    <Text color="red" marginLeft="$2" fontSize="$5">
                      Report
                    </Text>
                  ),
                  icon: <AlertCircle size="$1.5" color="red" />,
                  onPress: () => {
                    setTimeout(() => {
                      setIsReportModalVisible(true);
                    }, 275);
                  },
                },
              ]
        }
      >
        <View padding="$3.5" backgroundColor="$gray4" borderRadius="$7">
          <XStack gap="$3" alignItems="center">
            <Avatar circular size="$4">
              <Avatar.Image
                accessibilityLabel="Cam"
                src={comment.profilePictureUrl}
              />
              <Avatar.Fallback backgroundColor="$blue10" />
            </Avatar>
            <YStack gap="$2">
              <XStack gap="$2">
                <Text fontWeight="bold">{comment.username}</Text>
                <Text color="$gray10">
                  {timeAgo.format(new Date(comment.createdAt))}
                </Text>
              </XStack>
              <Text>{comment.body}</Text>
            </YStack>
          </XStack>
        </View>
        <ReportCommentActionSheet
          title="Report Comment"
          subtitle="Select reason"
          commentId={comment.commentId}
          isVisible={isReportModalVisible}
          onCancel={() => setIsReportModalVisible(false)}
        />
      </BlurContextMenuWrapper>
    );
  };

  const renderHeader = useCallback(
    () => (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
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
      {commentsLoading && (
        <View flex={1} justifyContent="center" alignItems="center">
          <Spinner size="large" color="white" />
        </View>
      )}
      {
        // if there are no comments render a message
        !commentsLoading && comments.length === 0 ? (
          <View flex={1} justifyContent="center" alignItems="center">
            <SizableText size="$7" fontWeight="bold">
              No comments yet
            </SizableText>
            <Text color="$gray10">Be the first to comment</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={comments}
            itemLayoutAnimation={LinearTransition}
            scrollEnabled={true}
            keyExtractor={(item) => item.commentId.toString()}
            renderItem={({ item }) => <Comment comment={item} />}
            onEndReached={handleOnEndReached}
          />
        )
      }
      <XStack
        borderTopColor="$gray5"
        borderTopWidth="$0.25"
        justifyContent="space-evenly"
        alignItems="center"
        paddingTop="$3"
        backgroundColor="$gray4"
      >
        {emojiList.map((emoji) => (
          <TouchableOpacity key={emoji} onPress={() => handleEmojiPress(emoji)}>
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
        <Avatar circular size="$4" flex={1}>
          <Avatar.Image
            accessibilityLabel="User Avatar"
            src={profile?.profilePictureUrl}
          />
          <Avatar.Fallback backgroundColor="$blue10" />
        </Avatar>
        <View style={{ flex: 5 }}>
          <BottomSheetTextInput
            placeholder="add a comment..."
            maxLength={100}
            value={inputValue}
            onChangeText={setInputValue}
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
    </BottomSheetWrapper>
  );
};

export default CommentsBottomSheet;
