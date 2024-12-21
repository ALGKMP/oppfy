import { TouchableOpacity } from "react-native";
import { Send } from "@tamagui/lucide-icons";
import useShare from "~/hooks/useShare";

interface ShareButtonProps {
  postId: string;
}

const ShareButton = ({ postId }: ShareButtonProps) => {
  const { share } = useShare();

  return (
    <TouchableOpacity
      onPress={async () => {
        await share({
          url: `https://opp.oppfy.app/post/${postId}`,
          title: "Share post",
        });
      }}
    >
      <Send size={26} color="$gray12" />
    </TouchableOpacity>
  );
};

export default ShareButton;