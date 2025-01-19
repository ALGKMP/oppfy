import { TouchableOpacity } from "react-native";
import { Send } from "@tamagui/lucide-icons";

import useShare from "~/hooks/useShare";

interface ShareButtonProps {
  postId: string;
  mediaUrl: string;
  recipientName: string;
}

const ShareButton = ({ postId, mediaUrl, recipientName }: ShareButtonProps) => {
  const { share } = useShare();

  return (
    <TouchableOpacity
      onPress={async () => {
        const appClipUrl = new URL("/post", "https://oppfy.app");
        appClipUrl.searchParams.set("id", postId);
        appClipUrl.searchParams.set("media", encodeURIComponent(mediaUrl));
        appClipUrl.searchParams.set("name", encodeURIComponent(recipientName));

        await share({
          url: appClipUrl.toString(),
          title: "Check out what was posted for you!",
        });
      }}
    >
      <Send size={26} color="$gray12" />
    </TouchableOpacity>
  );
};

export default ShareButton;
