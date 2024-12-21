import React from "react";
import { TouchableOpacity } from "react-native";
import { MessageCircle } from "@tamagui/lucide-icons";
import { SizableText, XStack } from "tamagui";

import { useBottomSheetController } from "~/components/ui/NewBottomSheet";
import { Text } from "../ui";

// import CommentsBottomSheet from "./ui/CommentsBottomSheet";

interface CommentButtonProps {
  postId: string;
  commentCount: number;
  selfProfilePicture?: string;
}

const CommentButton = ({
  postId,
  commentCount,
  selfProfilePicture,
}: CommentButtonProps) => {
  const { show } = useBottomSheetController();

  const handlePress = () => {
    show({
      snapPoints: ["90%"],
      children: (
        // <CommentsBottomSheet
        //   postId={postId}
        //   selfProfilePicture={selfProfilePicture}
        // />
        <Text>Hello</Text>
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
