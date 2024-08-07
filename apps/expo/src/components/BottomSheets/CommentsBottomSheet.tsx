import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Keyboard, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import BottomSheet, { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  AlertCircle,
  Minus,
  SendHorizontal,
  Trash2,
} from "@tamagui/lucide-icons";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { size } from "lodash";
import { input } from "node_modules/@oppfy/validators/src/trpc";
import {
  Avatar,
  getToken,
  SizableText,
  Spinner,
  Text,
  TextArea,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";
import type z from "zod";

import type { sharedValidators } from "@oppfy/validators";

import { api } from "~/utils/api";
import { BlurContextMenuWrapper } from "../ContextMenu";
import { ReportPostActionSheet } from "../Sheets";
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
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const utils = api.useUtils();
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["100%"], []);
    const theme = useTheme();
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

    const [inputValue, setInputValue] = useState("");

    const handleChangeText = useCallback((text: string) => {
      setInputValue(text);
    }, []);

    const emojiList = ["❤️", "🙏", "🔥", "😂", "😭", "😢", "😲", "😍"];
    const handleEmojiPress = useCallback((emoji: string) => {
      setInputValue((prev) => prev + emoji);
    }, []);

    const commentOnPost = api.post.createComment.useMutation({
      onMutate: async (newComment) => {
        // Cancel any outgoing refetches to avoid overwriting optimistic update
        await utils.post.paginateComments.cancel({ postId, pageSize: 10 });
        if (isSelfPost) {
          await utils.post.paginatePostsOfUserSelf.cancel({ pageSize: 10 });
        } else {
          await utils.post.paginatePostsOfUserOther.cancel({
            userId: userIdOfPostRecipient,
            pageSize: 10,
          });
        }

        // Snapshot the previous value
        const prevCommentsData = utils.post.paginateComments.getInfiniteData({
          postId,
          pageSize: 10,
        });
        const prevPostsData = isSelfPost
          ? utils.post.paginatePostsOfUserSelf.getInfiniteData({
              pageSize: 10,
            })
          : utils.post.paginatePostsOfUserOther.getInfiniteData({
              userId: userIdOfPostRecipient,
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
                  // check if it's postId
                  page.items.map((item) => {
                    if (item?.postId === postId) {
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
            { userId: userIdOfPostRecipient, pageSize: 10 },
            (prevData) => {
              if (!prevData) return prevData;
              return {
                ...prevData,
                pages: prevData.pages.map((page) => {
                  // check if it's postId
                  page.items.map((item) => {
                    if (item?.postId === postId) {
                      item.commentsCount += 1;
                    }
                  });
                  return page;
                }),
              };
            },
          );
        }

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
        return { prevCommentsData, prevPostsData };
      },
      onError: (err, _newData, ctx) => {
        // Rollback to the previous value on error
        console.error(err);
        if (ctx?.prevCommentsData) {
          utils.post.paginateComments.setInfiniteData(
            { postId, pageSize: 10 },
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
              { userId: userIdOfPostRecipient, pageSize: 10 },
              ctx.prevPostsData,
            );
          }
        }
      },
      // onSettled: async () => {
      //   await utils.post.paginateComments.invalidate({ postId, pageSize: 10 });
      // },
    });

    const handlePostComment = useCallback(async () => {
      if (inputValue.trim().length === 0) return;
      const newComment = {
        postId,
        body: inputValue,
      };
      setInputValue("");
      await commentOnPost.mutateAsync(newComment);
    }, [inputValue, postId, commentOnPost]);

    const renderItem = useCallback(
      ({ item }: { item: Comment }) => (
        <Comment
          comment={item}
          isSelfPost={isSelfPost}
          postId={postId}
          userIdOfPostRecipient={userIdOfPostRecipient}
        />
      ),
      [isSelfPost, postId, userIdOfPostRecipient],
    );

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

    const handleOnEndReached = useCallback(async () => {
      if (!isFetchingNextPage && hasNextPage) {
        await fetchNextPage();
      }
    }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

    const comments = useMemo(
      () =>
        commentsData?.pages
          .flatMap((page) => page.items)
          .filter((item): item is Comment => item !== undefined) ?? [],
      [commentsData],
    );

    const memoizedComments = useMemo(() => comments, [comments]);

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
              data={memoizedComments}
              itemLayoutAnimation={LinearTransition}
              scrollEnabled={true}
              keyExtractor={(item) => item.commentId.toString()}
              renderItem={renderItem}
              onEndReached={handleOnEndReached}
            />
          )
        }
        <YStack
          padding="$4"
          paddingBottom={(insets.bottom + getToken("$0.5", "space")) as number}
          borderColor="$gray6"
          borderTopWidth={StyleSheet.hairlineWidth}
          gap="$4"
        >
          <XStack justifyContent="space-between">
            {emojiList.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleEmojiPress(emoji)}
              >
                <SizableText size="$8">{emoji}</SizableText>
              </TouchableOpacity>
            ))}
          </XStack>
          <XStack alignItems="flex-end" gap="$3">
            <MemoizedAvatar src={profile?.profilePictureUrl} size={46} />
            <View style={{ flex: 1, position: "relative" }}>
              <BottomSheetTextInput
                placeholder="Add a comment..."
                maxLength={250}
                multiline={true}
                value={inputValue}
                onChangeText={handleChangeText}
                textAlignVertical="center"
                style={{
                  minHeight: 46,
                  color: theme.color.val,
                  backgroundColor: theme.gray5.val,
                  textAlignVertical: "center",
                  padding: getToken("$3", "space") as number,
                  paddingRight: 64,
                  borderRadius: getToken("$6", "radius") as number,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.gray6.val,
                }}
              />
              <View
                position="absolute"
                bottom={4}
                right={4}
                paddingVertical="$2"
                paddingHorizontal="$3.5"
                borderRadius="$6"
                backgroundColor="#F214FF"
                disabled={inputValue.length === 0}
                disabledStyle={{
                  opacity: 0.5,
                  backgroundColor: "$gray6",
                }}
              >
                <TouchableOpacity onPress={handlePostComment}>
                  <SendHorizontal />
                </TouchableOpacity>
              </View>
            </View>
          </XStack>
        </YStack>
      </BottomSheetWrapper>
    );
  },
);

const MemoizedAvatar = React.memo(
  ({ src, size }: { src: string | null | undefined; size: number }) => (
    <Image
      source={src ?? DefaultProfilePicture}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
    />
  ),
);

interface CommentProps {
  comment: Comment;
  isSelfPost: boolean;
  postId: number;
  userIdOfPostRecipient: string;
}

const Comment = React.memo(
  ({ comment, isSelfPost, postId, userIdOfPostRecipient }: CommentProps) => {
    TimeAgo.addLocale(en);
    const timeAgo = new TimeAgo("en-US");
    const utils = api.useUtils();

    const profile = utils.profile.getFullProfileSelf.getData();

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
        const prevCommentsData = utils.post.paginateComments.getInfiniteData({
          postId,
          pageSize: 10, // TODO: In theory, prevComments should only be the first 10 comments now
        });
        const prevPostsData = isSelfPost
          ? utils.post.paginatePostsOfUserSelf.getInfiniteData({
              pageSize: 10,
            })
          : utils.post.paginatePostsOfUserOther.getInfiniteData({
              userId: userIdOfPostRecipient,
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
            { userId: userIdOfPostRecipient, pageSize: 10 },
            (prevData) => {
              // TODO: If prevData is only the first pages, then this should not optimistically update
              console.log("prevData", prevData);
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
        utils.post.paginateComments.setInfiniteData(
          { postId, pageSize: 10 },
          (prevData) => {
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
          },
        );

        // Return a context object with the snapshotted value
        return { prevCommentsData, prevPostsData };
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
        if (ctx?.prevPostsData) {
          if (isSelfPost) {
            utils.post.paginatePostsOfUserSelf.setInfiniteData(
              { pageSize: 10 },
              ctx.prevPostsData,
            );
          } else {
            utils.post.paginatePostsOfUserOther.setInfiniteData(
              { userId: userIdOfPostRecipient, pageSize: 10 },
              ctx.prevPostsData,
            );
          }
        }
      },
      onSettled: async () => {
        // Only invalidate on success
        await utils.post.paginateComments.invalidate({ postId, pageSize: 10 });
        if (isSelfPost) {
          await utils.post.paginatePostsOfUserSelf.invalidate();
        } else {
          await utils.post.paginatePostsOfUserOther.invalidate();
        }
      },
    });

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
                      // setIsReportModalVisible(true);
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
                      // setIsReportModalVisible(true);
                    }, 275);
                  },
                },
              ]
        }
      >
        <View padding="$3.5" backgroundColor="$gray4" borderRadius="$7">
          <XStack gap="$3" alignItems="center">
            <MemoizedAvatar src={comment.profilePictureUrl} size={46} />
            <YStack gap="$2" width="100%" flex={1}>
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
        {/* <ReportCommentActionSheet
          title="Report Comment"
          subtitle="Select reason"
          commentId={comment.commentId}
          isVisible={isReportModalVisible}
          onCancel={() => setIsReportModalVisible(false)}
        /> */}
      </BlurContextMenuWrapper>
    );
  },
);

export default CommentsBottomSheet;
