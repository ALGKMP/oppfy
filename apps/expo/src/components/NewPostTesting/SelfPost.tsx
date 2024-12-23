import React, { memo, useCallback, useRef, useState } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { AlertDialog } from "../Dialogs";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import { useAlertDialogController } from "../ui";
import { useBottomSheetController } from "../ui/NewBottomSheet";
import { useComments } from "./hooks/useComments";
import { useDeletePost } from "./hooks/useDeletePost";
import { useLikePost } from "./hooks/useLikePost";
import { usePostActions } from "./hooks/usePostActions";
import CommentsBottomSheet from "./ui/CommentsBottomSheet";
import type { PostData } from "./ui/PostCard";
import PostCard from "./ui/PostCard";

type SheetState = "closed" | "moreOptions" | "confirmDelete";

interface MoreOptionsSheetProps {
  isVisible: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onSavePost: () => void;
  onDeletePost: () => void;
}

const MoreOptionsSheet = memo(
  ({
    isVisible,
    isSaving,
    isDeleting,
    onClose,
    onSavePost,
    onDeletePost,
  }: MoreOptionsSheetProps) => {
    const moreOptionsButtonOptions = React.useMemo(
      () =>
        [
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
        ] satisfies ButtonOption[],
      [isSaving, isDeleting, onSavePost, onDeletePost],
    );

    return (
      <ActionSheet
        isVisible={isVisible}
        buttonOptions={moreOptionsButtonOptions}
        onCancel={onClose}
      />
    );
  },
);

const SelfPost = memo((postProps: PostData) => {
  const alertDialog = useAlertDialogController();
  const { show: showComments } = useBottomSheetController();

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

  const handleComment = useCallback(() => {
    showComments({
      children: (
        <CommentsBottomSheet
          postId={postProps.id}
          postRecipientUserId={postProps.recipient.id}
          endpoint="self-profile"
        />
      ),
      snapPoints: ["90%"],
      title: "Comments",
    });
  }, [showComments, postProps.id, postProps.recipient.id]);

  const handleOpenMoreOptionsSheet = useCallback(() => {
    setSheetState("moreOptions");
  }, []);

  const handleOpenConfirmDeleteDialog = useCallback(() => {
    setSheetState("closed");
    setTimeout(() => setSheetState("confirmDelete"), 500);
  }, []);

  const handleCloseMoreOptionsSheet = useCallback(() => {
    setSheetState("closed");
  }, []);

  const handleDeletePost = useCallback(async () => {
    const confirmed = await alertDialog.show({
      title: "Are you sure you want to delete this post?",
      subtitle: "This action cannot be undone.",
      acceptText: "Delete",
      acceptTextProps: { color: "$red9" },
      cancelText: "Cancel",
    });

    if (confirmed) {
      deletePost({ postId: postProps.id });
    }
  }, [deletePost, postProps.id, alertDialog]);

  const handlePressProfilePictureCallback = useCallback(
    (userId: string, username: string) => {
      bottomSheetModalRef.current?.close();
      handlePressProfilePicture(userId, username);
    },
    [handlePressProfilePicture],
  );

  const handlePressUsernameCallback = useCallback(
    (userId: string, username: string) => {
      bottomSheetModalRef.current?.close();
      handlePressUsername(userId, username);
    },
    [handlePressUsername],
  );

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

      {sheetState === "moreOptions" && (
        <MoreOptionsSheet
          isVisible={true}
          onClose={handleCloseMoreOptionsSheet}
          onSavePost={handleSavePost}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onDeletePost={handleDeletePost}
        />
      )}
    </>
  );
});

export default SelfPost;
