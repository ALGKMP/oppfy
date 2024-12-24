import React, { memo, useCallback, useRef, useState } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import type { RouterInputs } from "~/utils/api";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import { useComments } from "./hooks/useComments";
import { useLikePost } from "./hooks/useLikePost";
import { usePostActions } from "./hooks/usePostActions";
import { useReportPost } from "./hooks/useReportPost";
import PostCard from "./ui/PostCard";
import type { PostData } from "./ui/PostCard";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];
type _ReportCommentReason = RouterInputs["report"]["reportComment"]["reason"];

type SheetState = "closed" | "moreOptions" | "reportOptions";

interface MoreOptionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSavePost: () => void;
  onReportPost: () => void;
  isSaving: boolean;
}

const MoreOptionsSheet = ({
  isVisible,
  onClose,
  onSavePost,
  onReportPost,
  isSaving,
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
      text: "Report Post",
      textProps: {
        color: "$red9",
      },
      disabled: isSaving,
      onPress: onReportPost,
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

interface ReportOptionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onReportPost: (reason: ReportPostReason) => void;
}

const ReportOptionsSheet = ({
  isVisible,
  onClose,
  onReportPost,
}: ReportOptionsSheetProps) => {
  const reportPostOptionsButtonOptions = [
    {
      text: "Violent or abusive",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Violent or abusive"),
    },
    {
      text: "Sexually explicit or predatory",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Sexually explicit or predatory"),
    },
    {
      text: "Hate, harassment, or bullying",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Hate, harassment or bullying"),
    },
    {
      text: "Suicide and self-harm",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Suicide and self-harm"),
    },
    {
      text: "Scam or spam",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Spam or scam"),
    },
    {
      text: "Other",
      textProps: { color: "$blue9" },
      onPress: () => void onReportPost("Other"),
    },
  ] satisfies ButtonOption[];

  return (
    <ActionSheet
      isVisible={isVisible}
      buttonOptions={reportPostOptionsButtonOptions}
      onCancel={onClose}
    />
  );
};

interface OtherPostProps extends PostData {
  endpoint: "other-profile" | "home-feed";
}

const OtherPost = memo((postProps: OtherPostProps) => {
  const [sheetState, setSheetState] = useState<SheetState>("closed");

  const { hasLiked, handleLikePressed, handleLikeDoubleTapped } = useLikePost({
    postId: postProps.id,
    endpoint: postProps.endpoint,
    userId: postProps.recipient.id,
  });
  const { handleReportPost } = useReportPost(postProps.id);

  const {
    commentItems,
    isLoadingComments,
    handleLoadMoreComments,
    handlePostComment,
    handleDeleteComment,
    handleReportComment,
    handlePressProfilePicture,
    handlePressUsername,
  } = useComments({
    postId: postProps.id,
    endpoint: postProps.endpoint,
    userId: postProps.recipient.id,
  });

  const { handleSavePost, isSaving } = usePostActions(postProps);

  const handleOpenMoreOptionsSheet = useCallback(() => {
    setSheetState("moreOptions");
  }, []);

  const handleCloseMoreOptionsSheet = useCallback(() => {
    setSheetState("closed");
  }, []);

  const handleOpenReportOptionsSheet = useCallback(() => {
    setTimeout(() => setSheetState("reportOptions"), 400);
  }, []);

  const handleCloseReportOptionsSheet = useCallback(() => {
    setSheetState("closed");
  }, []);

  return (
    <>
      <PostCard
        {...postProps}
        loading={false}
        hasLiked={hasLiked}
        onLikePressed={handleLikePressed}
        onLikeDoubleTapped={handleLikeDoubleTapped}
        onMoreOptions={handleOpenMoreOptionsSheet}
      />

      {sheetState === "moreOptions" && (
        <MoreOptionsSheet
          isVisible={true}
          onClose={handleCloseMoreOptionsSheet}
          onSavePost={handleSavePost}
          onReportPost={handleOpenReportOptionsSheet}
          isSaving={isSaving}
        />
      )}

      {sheetState === "reportOptions" && (
        <ReportOptionsSheet
          isVisible={true}
          onClose={handleCloseReportOptionsSheet}
          onReportPost={handleReportPost}
        />
      )}
    </>
  );
});

export default OtherPost;
