import React, { useRef, useState } from "react";
import { Position } from "react-native-image-marker";
import { useRouter } from "expo-router";
import watermark from "@assets/watermark.png";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useToastController } from "@tamagui/toast";

import type { RouterInputs } from "~/utils/api";
import type { ButtonOption } from "../Sheets";
import { ActionSheet } from "../Sheets";
import CommentsBottomSheet from "./ui/CommentsBottomSheet";
import PostCard from "./ui/PostCard";
import type { PostData as OtherPostProps } from "./ui/PostCard";
import { useComments } from "./useComments";
import { useLikePost } from "./useLikePost";
import { useSaveMedia } from "./useSaveMedia";
import { useReportPost } from "./useReportPost";

type ReportPostReason = RouterInputs["report"]["reportPost"]["reason"];
type _ReportCommentReason = RouterInputs["report"]["reportComment"]["reason"];

type SheetState = "closed" | "moreOptions" | "reportOptions";


export const usePostActions = (postProps: OtherPostProps) => {
  const router = useRouter();
  const toast = useToastController();
  const { saveMedia, isSaving } = useSaveMedia();

  const handleSavePost = async () => {
    await saveMedia(postProps.media.url, {
      image: watermark,
      position: Position.bottomRight,
      scale: 0.7,
    });
    toast.show("Post Saved");
  };

  const handleShare = () => {
    // TODO: Implement sharing
  };

  const handleRecipientPress = () => {
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.recipient.id,
        username: postProps.recipient.username,
      },
    });
  };

  const handleAuthorPress = () => {
    router.push({
      pathname: `/profile/[userId]`,
      params: {
        userId: postProps.author.id,
        username: postProps.author.username,
      },
    });
  };

  return {
    handleSavePost,
    handleShare,
    handleRecipientPress,
    handleAuthorPress,
    isSaving,
  };
};

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

const OtherPost = (postProps: OtherPostProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [sheetState, setSheetState] = useState<SheetState>("closed");

  const { hasLiked, handleLikePressed, handleLikeDoubleTapped } = useLikePost(
    postProps.id,
  );
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

  const handleCloseMoreOptionsSheet = () => {
    setSheetState("closed");
  };

  const handleOpenReportOptionsSheet = () => {
    setTimeout(() => setSheetState("reportOptions"), 400);
  };

  const handleCloseReportOptionsSheet = () => {
    setSheetState("closed");
  };

  return (
    <>
      <PostCard
        {...postProps}
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

      <ReportOptionsSheet
        isVisible={sheetState === "reportOptions"}
        onClose={handleCloseReportOptionsSheet}
        onReportPost={handleReportPost}
      />

      <MoreOptionsSheet
        isVisible={sheetState === "moreOptions"}
        onClose={handleCloseMoreOptionsSheet}
        onSavePost={handleSavePost}
        onReportPost={handleOpenReportOptionsSheet}
        isSaving={isSaving}
      />
    </>
  );
};

export default OtherPost;
