import { TouchableOpacity } from "react-native";
import { Send } from "@tamagui/lucide-icons";

import useShare from "~/hooks/useShare";

interface ShareButtonProps {
  postId: string;
  light?: boolean;
  compact?: boolean;
}

const ShareButton = ({ postId, light, compact }: ShareButtonProps) => {
  const { share } = useShare();

  return (
    <TouchableOpacity
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      onPress={async () => {
        await share({
          url: `https://www.oppfy.app/post/${postId}`,
          title: "Share post",
        });
      }}
    >
      <Send
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

export default ShareButton;
