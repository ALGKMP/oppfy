import React, { useRef, useState } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { api } from "~/utils/api";
import type { RouterInputs } from "~/utils/api";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import CommentsBottomSheet from "./ui/CommentsBottomSheet";
import PostCard from "./ui/PostCard";
import type { PostData as OtherPostProps } from "./ui/PostCard";
import { useComments } from "./useComments";
import { useLikePost } from "./useLikePost";
import { usePostActions } from "./usePostActions";
import { useReportPost } from "./useReportPost";
import { Dialog } from "../Dialogs";
import AlertDialog from "../Dialogs/Dialog";

type SheetState = "closed" | "moreOptions" | "confirmDelete";

const useDeletePost = (postId: string) => {
  const utils = api.useUtils();
  const { mutate: deletePost, isLoading: isDeleting } = api.post.deletePost.useMutation({
    onMutate: async (newData) => {
      await utils.post.paginatePostsOfUserSelf.invalidate();

      const prevData = utils.post.paginatePostsOfUserSelf.getInfiniteData();
      if (!prevData) return;

      utils.post.paginatePostsOfUserSelf.setInfiniteData(
        {},
        {
          ...prevData,
          pages: prevData.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.postId != newData.postId),
          })),
        },
      );
      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (!ctx) return;
      utils.post.paginatePostsOfUserSelf.setInfiniteData(
        { pageSize: 10},
        ctx.prevData,
      );
    },
    onSettled: async () => {
      await utils.post.paginatePostsOfUserSelf.invalidate();
    },
  });

  return {
    deletePost,
    isDeleting,
  };
};

interface MoreOptionsSheetProps {
  isVisible: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSavePost: () => void;
  onDeletePost: () => void;
}

const MoreOptionsSheet = ({
  isVisible,
  isSaving,
  isDeleting,
  onClose,
  onSavePost,
  onDeletePost,
}: MoreOptionsSheetProps) => {
  const moreOptionsButtonOptions = [
    {
      text: isSaving ? "Saving" : "Save Post",
      textProps: {
        color: isSaving ? "$gray9" : undefined,
      },
      autoClose: false,
      disabled: isSaving,
      onPress: onSavePost,
    },
    {
      text: "Delete Post",
      textProps: {
        color: "$red9",
      },
      disabled: isDeleting,
      onPress: onDeletePost,
    },
  ] satisfies ButtonOption[];

  return (
    <ActionSheet
      isVisible={isVisible}
      buttonOptions={moreOptionsButtonOptions}
      onCancel={onClose}
    />
  );
};

const SelfPost = (postProps: OtherPostProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [sheetState, setSheetState] = useState<SheetState>("closed");

  const { hasLiked, handleLikePressed, handleLikeDoubleTapped } = useLikePost(
    postProps.id,
  );

  const {
    commentItems,
    isLoadingComments,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
    handlePressProfilePicture,
    handlePressUsername,
  } = useComments(postProps.id);

  const {
    handleSavePost,
    handleShare,
    handleRecipientPress,
    handleAuthorPress,
    isSaving,
  } = usePostActions(postProps);

  const handleComment = () => {
    bottomSheetModalRef.current?.present();
  };

  const handleOpenMoreOptionsSheet = () => {
    setSheetState("moreOptions");
  };

  const handleOpenConfirmDeleteDialog = () => {
    setSheetState("closed"); // Close the MoreOptionsSheet first
    setTimeout(() => {
      setSheetState("confirmDelete"); // Then open the AlertDialog
    }, 500); // Add a slight delay to ensure the sheet is closed before opening the dialog
  };

  const handleCloseMoreOptionsSheet = () => {
    setSheetState("closed");
  };

  const { deletePost, isDeleting } = useDeletePost(postProps.id);

  const handleDeletePost = () => {
    deletePost({ postId: postProps.id });
  };

  const handleCloseConfirmDeleteDialog = () => {
    setSheetState("closed");
  };

  return (
    <>
      <PostCard
        {...postProps}
        loading={false}
        hasLiked={hasLiked}
        onLikePressed={handleLikePressed}
        onLikeDoubleTapped={handleLikeDoubleTapped}
        onComment={handleComment}
        onShare={handleShare}
        onMoreOptions={handleOpenMoreOptionsSheet}
        onAuthorPress={handleAuthorPress}
        onRecipientPress={handleRecipientPress}
      />

      <CommentsBottomSheet
        ref={bottomSheetModalRef}
        comments={commentItems}
        isLoading={isLoadingComments}
        onEndReached={handleLoadMoreComments}
        onPostComment={handlePostComment}
        onDeleteComment={handleDeleteComment}
        onReportComment={handleReportComment}
        onPressProfilePicture={(userId, username) => {
          bottomSheetModalRef.current?.close();
          handlePressProfilePicture(userId, username);
        }}
        onPressUsername={(userId, username) => {
          bottomSheetModalRef.current?.close();
          handlePressUsername(userId, username);
        }}
        selfUserId={postProps.self.id}
        selfProfilePicture={postProps.self.profilePicture}
      />

      <MoreOptionsSheet
        isVisible={sheetState === "moreOptions"}
        onClose={handleCloseMoreOptionsSheet}
        onSavePost={handleSavePost}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onDeletePost={handleOpenConfirmDeleteDialog}
      />

      <AlertDialog
        isVisible={sheetState === "confirmDelete"}
        onAccept={handleDeletePost}
        title="Are you sure you want to delete this post?"
        subtitle="This action cannot be undone."
        acceptText="Delete"
        acceptTextProps={{ color: "$red9" }}
      />
    </>
  );
};

export default SelfPost;
