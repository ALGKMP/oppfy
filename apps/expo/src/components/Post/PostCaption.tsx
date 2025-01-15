import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

import { Paragraph, Text } from "~/components/ui/";

interface PostCaptionProps {
  caption: string;
  light?: boolean;
  username: string;
}

const PostCaption = ({ caption, light, username }: PostCaptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!caption) return null;

  const textColor = light ? "white" : "$color";
  const moreColor = light ? "rgba(255,255,255,0.8)" : "$gray10";

  return (
    <TouchableOpacity
      disabled={isExpanded || caption.length <= 110}
      onPress={() => setIsExpanded(!isExpanded)}
    >
      <Paragraph
        fontSize="$4"
        lineHeight={22}
        opacity={light ? 1 : 0.9}
        color={textColor}
        shadowColor={light ? "black" : undefined}
        shadowOffset={light ? { width: 1, height: 1 } : undefined}
        shadowOpacity={light ? 0.3 : undefined}
        shadowRadius={light ? 2 : undefined}
      >
        <Text fontWeight="600" color={textColor}>
          {username}
        </Text>{" "}
        {isExpanded ? (
          caption
        ) : (
          <>
            {caption.slice(0, 110)}
            {caption.length > 110 && (
              <>
                ...
                <Text color={moreColor} fontWeight="500">
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
