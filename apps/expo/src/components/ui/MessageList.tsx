import React, { useCallback, useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";

import { View } from "./";
import { Message } from "./Messages/Message";
import type { MessageProps } from "./Messages/Message";

export interface MessageListProps {
  messages: Omit<MessageProps, "theme">[];
  theme?: MessageProps["theme"];
  autoScroll?: boolean;
  onAnimationComplete?: () => void;
  estimatedItemSize?: number;
  style?: React.ComponentProps<typeof View>["style"];
}

export const MessageList = ({
  messages,
  theme = {
    colors: {
      primary: "#007AFF",
      secondary: "#1A1A1A",
      background: "#1A1A1A",
      text: "#FFFFFF",
    },
    borderRadius: 20,
  },
  autoScroll = true,
  onAnimationComplete,
  estimatedItemSize = 80,
  style,
}: MessageListProps) => {
  const listRef = useRef<FlashList<MessageProps>>(null);
  const { bottom } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<MessageProps[]>([]);

  const renderMessage = useCallback(
    ({ item: message }: { item: MessageProps }) => (
      <Message {...message} theme={theme} />
    ),
    [theme],
  );

  const getItemType = useCallback((item: MessageProps) => {
    return item.type;
  }, []);

  useEffect(() => {
    if (!messages.length || !autoScroll) {
      setVisibleMessages(messages);
      return;
    }

    setVisibleMessages([]); // Reset on messages change
    let accumulatedTime = 0;

    messages.forEach((message, index) => {
      const delay = message.animation?.delay ?? 0;
      const duration = message.animation?.duration ?? 500;

      // Add message after its delay
      const messageTimeout = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, message]);

        // Scroll to the new message
        const scrollTimeout = setTimeout(() => {
          listRef.current?.scrollToIndex({
            index,
            animated: true,
          });
        }, 50); // Small buffer for the message to be rendered
        timeoutRefs.current.push(scrollTimeout);

        // If it's the last message, call onAnimationComplete after the animation
        if (index === messages.length - 1 && onAnimationComplete) {
          const completeTimeout = setTimeout(
            onAnimationComplete,
            duration + 800, // Buffer for final animation
          );
          timeoutRefs.current.push(completeTimeout);
        }
      }, accumulatedTime + delay);

      timeoutRefs.current.push(messageTimeout);
      accumulatedTime += delay + duration;
    });

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, [messages, autoScroll, onAnimationComplete]);

  return (
    <View
      style={[
        {
          flex: 1,
          height: windowHeight,
        },
        style,
      ]}
    >
      <FlashList
        ref={listRef}
        data={visibleMessages}
        renderItem={renderMessage}
        estimatedItemSize={estimatedItemSize}
        getItemType={getItemType}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingBottom: bottom + 24,
        }}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />
    </View>
  );
};
