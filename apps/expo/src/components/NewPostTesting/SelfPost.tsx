import React, { useRef, useState } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { AlertDialog } from "../Dialogs";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import CommentsBottomSheet from "./ui/CommentsBottomSheet";
import type { PostData } from "./ui/PostCard";
import PostCard from "./ui/PostCard";
import { useComments } from "./useComments";
import { useDeletePost } from "./useDeletePost";
import { useLikePost } from "./useLikePost";
import { usePostActions } from "./usePostActions";

type SheetState = "closed" | "moreOptions" | "confirmDelete";

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

const SelfPost = (postProps: PostData) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [sheetState, setSheetState] = useState<SheetState>("closed");

  const { hasLiked, handleLikePressed, handleLikeDoubleTapped } = useLikePost({
    postId: postProps.id,
    endpoint: "self-profile",
  });

  const {
    commentItems,
    isLoadingComments,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
    handlePressProfilePicture,
    handlePressUsername,
  } = useComments({ postId: postProps.id, endpoint: "self-profile" });

  const {
    handleSavePost,
    handleShare,
    handleRecipientPress,
    handleAuthorPress,
    isSaving,
  } = usePostActions(postProps);

  const { deletePost, isDeleting } = useDeletePost();

  const handleComment = () => {
    bottomSheetModalRef.current?.present();
  };

  const handleOpenMoreOptionsSheet = () => {
    setSheetState("moreOptions");
  };

  const handleOpenConfirmDeleteDialog = () => {
    setSheetState("closed");
    setTimeout(() => setSheetState("confirmDelete"), 500);
  };

  const handleCloseMoreOptionsSheet = () => {
    setSheetState("closed");
  };

  const handleDeletePost = () => {
    deletePost({ postId: postProps.id });
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

      {sheetState === "moreOptions" && (
        <MoreOptionsSheet
          isVisible={true}
          onClose={handleCloseMoreOptionsSheet}
          onSavePost={handleSavePost}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onDeletePost={handleOpenConfirmDeleteDialog}
        />
      )}

      <AlertDialog
        isVisible={sheetState === "confirmDelete"}
        title="Are you sure you want to delete this post?"
        subtitle="This action cannot be undone."
        acceptText="Delete"
        acceptTextProps={{ color: "$red9" }}
        onAccept={handleDeletePost}
      />
    </>
  );
};

export default SelfPost;
