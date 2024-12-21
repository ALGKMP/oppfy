import React from "react";
import { TouchableOpacity } from "react-native";
import { MessageCircle } from "@tamagui/lucide-icons";

import { useBottomSheetController } from "~/components/ui/NewBottomSheet";

import CommentsBottomSheet from "./ui/CommentsBottomSheet";

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
  const { show } = useBottomSheetController();

  const handlePress = () => {
    show({
      snapPoints: ["90%"],
      children: (
        <CommentsBottomSheet
          postId={postId}
          endpoint={endpoint}
          postRecipientUserId={postRecipientUserId}
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
