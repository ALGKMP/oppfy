import React from "react";
import { TouchableOpacity } from "react-native";
import { MessageCircle } from "@tamagui/lucide-icons";

import CommentsBottomSheet from "~/components/Comment/CommentsBottomSheet";
import { useBottomSheetController } from "~/components/ui/BottomSheet";

interface CommentButtonProps {
  postId: string;
  postRecipientUserId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
  light?: boolean;
  compact?: boolean;
}

const CommentButton = ({
  postId,
  postRecipientUserId,
  endpoint,
  light,
  compact,
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
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MessageCircle
        size={compact ? 20 : 26}
        color={light ? "white" : "$gray12"}
        style={{
          shadowColor: "black",
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
        }}
      />
    </TouchableOpacity>
  );
};

export default CommentButton;
