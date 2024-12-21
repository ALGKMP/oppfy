import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

import { Paragraph, Text } from "~/components/ui/";

interface PostCaptionProps {
  caption: string;
}

const PostCaption = ({ caption }: PostCaptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TouchableOpacity
      disabled={isExpanded || caption.length <= 110}
      onPress={() => setIsExpanded(!isExpanded)}
    >
      <Paragraph>
        {isExpanded ? (
          caption
        ) : (
          <>
            {caption.slice(0, 110)}
            {caption.length > 110 && (
              <>
                ...
                <Text color="$gray8"> more</Text>
              </>
            )}
          </>
        )}
      </Paragraph>
    </TouchableOpacity>
  );
};

export default PostCaption;
