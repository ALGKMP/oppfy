import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

import { Paragraph, Text } from "~/components/ui/";

interface PostCaptionProps {
  caption: string;
}

const PostCaption = ({ caption }: PostCaptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!caption) return null;

  return (
    <TouchableOpacity
      disabled={isExpanded || caption.length <= 110}
      onPress={() => setIsExpanded(!isExpanded)}
    >
      <Paragraph
        fontSize="$4"
        lineHeight={22}
        opacity={1}
        shadowColor="black"
        shadowOffset={{ width: 1, height: 1 }}
        shadowOpacity={0.3}
        shadowRadius={2}
      >
        {isExpanded ? (
          caption
        ) : (
          <>
            {caption.slice(0, 110)}
            {caption.length > 110 && (
              <>
                ...
                <Text color="rgba(255,255,255,0.8)" fontWeight="500">
                  more
                </Text>
              </>
            )}
          </>
        )}
      </Paragraph>
    </TouchableOpacity>
  );
};

export default PostCaption;
