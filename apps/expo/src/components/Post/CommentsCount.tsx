import { TouchableOpacity } from "react-native";
import { BottomSheetView } from "@gorhom/bottom-sheet";

import CommentsBottomSheet from "~/components/BottomSheets/CommentsBottomSheet";
import { SizableText } from "~/components/ui/";
import { useBottomSheetController } from "~/components/ui/BottomSheet";

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
  const { show, hide } = useBottomSheetController();

  const handlePress = () => {
    show({
      snapPoints: ["100%"],
      title: "Comments",
      children: (
        <BottomSheetView style={{ flex: 1 }}>
          <CommentsBottomSheet
            onHideBottomSheet={hide}
            postId={postId}
            endpoint={endpoint}
            postRecipientUserId={postRecipientUserId}
          />
        </BottomSheetView>
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
