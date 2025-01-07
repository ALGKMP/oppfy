import React from "react";
import { TouchableOpacity } from "react-native";
import { MessageCircle } from "@tamagui/lucide-icons";

import CommentsBottomSheet from "~/components/Comment/CommentsBottomSheet";
import { useBottomSheetController } from "~/components/ui/BottomSheet";

interface CommentButtonProps {
  postId: string;
  postRecipientUserId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
}

const CommentButton = ({
  postId,
  postRecipientUserId,
  endpoint,
}: CommentButtonProps) => {
  const { show, hide } = useBottomSheetController();

  const handlePress = () => {
    show({
      snapPoints: ["100%"],
      title: "Comments",
      children: (
        <CommentsBottomSheet
          postId={postId}
          endpoint={endpoint}
          postRecipientUserId={postRecipientUserId}
          onHideBottomSheet={hide}
        />
      ),
    });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <MessageCircle size="$2" color="$gray12" />
    </TouchableOpacity>
  );
};

export default CommentButton;
