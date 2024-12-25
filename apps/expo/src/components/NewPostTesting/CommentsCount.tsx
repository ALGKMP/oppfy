import { TouchableOpacity } from "react-native";

import { SizableText } from "~/components/ui/";
import { useBottomSheetController } from "~/components/ui/NewBottomSheet";
import CommentsBottomSheet from "./CommentsBottomSheet";

interface CommentsCountProps {
  commentsCount: number;
  postId: string;
  endpoint: "self-profile" | "other-profile" | "single-post" | "home-feed";
  postRecipientUserId: string;
}

const CommentsCount = ({
  commentsCount,
  postId,
  endpoint,
  postRecipientUserId,
}: CommentsCountProps) => {
  const { show } = useBottomSheetController();

  const handlePress = () => {
    show({
      snapPoints: ["90%"],
      title: "Comments",
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
      <SizableText size="$3" color="$gray10">
        {commentsCount > 0
          ? `View ${commentsCount > 1 ? "all " : ""}${commentsCount} ${commentsCount === 1 ? "comment" : "comments"}`
          : "Be the first to comment"}
      </SizableText>
    </TouchableOpacity>
  );
};

export default CommentsCount;
