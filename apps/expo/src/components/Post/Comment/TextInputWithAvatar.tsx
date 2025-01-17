import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { SendHorizontal } from "@tamagui/lucide-icons";
import { useTheme } from "tamagui";

import { SizableText, View, XStack, YStack } from "~/components/ui";
import useProfile from "~/hooks/useProfile";
import { Avatar } from "~/components/ui";

interface CommentInputProps {
  onPostComment: (comment: string) => void;
}

const EMOJI_LIST = ["❤️", "🙏", "🔥", "😂", "😭", "😢", "😲", "😍"];

const TextInputWithAvatar = ({ onPostComment }: CommentInputProps) => {
  const { profile } = useProfile();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState("");

  const handleChangeText = (text: string) => {
    setInputValue(text);
  };

  const handlePostComment = () => {
    if (inputValue.trim().length === 0) return;
    onPostComment(inputValue);
    setInputValue("");
  };

  const handleEmojiPress = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
  };

  return (
    <YStack
      padding="$4"
      paddingBottom={insets.bottom ? insets.bottom : "$4"}
      borderColor="$gray6"
      borderTopWidth={StyleSheet.hairlineWidth}
      gap="$4"
    >
      <XStack justifyContent="space-between">
        {EMOJI_LIST.map((emoji) => (
          <TouchableOpacity key={emoji} onPress={() => handleEmojiPress(emoji)}>
            <SizableText size="$8">{emoji}</SizableText>
          </TouchableOpacity>
        ))}
      </XStack>
      <XStack alignItems="flex-start" gap="$3">
        <Avatar source={profile?.profilePictureUrl} size={46} bordered />
        <View flex={1} position="relative">
          <BottomSheetTextInput
            placeholder="Add a comment..."
            maxLength={250}
            multiline={true}
            value={inputValue}
            onChangeText={handleChangeText}
            style={[
              styles.input,
              {
                color: theme.color.val,
                backgroundColor: theme.gray5.val,
                borderColor: theme.gray6.val,
              },
            ]}
          />
          <View
            position="absolute"
            bottom={4}
            right={4}
            paddingVertical="$2"
            paddingHorizontal="$3.5"
            borderRadius="$6"
            backgroundColor="#F214FF"
            opacity={inputValue.length === 0 ? 0.5 : 1}
          >
            <TouchableOpacity
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handlePostComment();
              }}
              disabled={inputValue.length === 0}
            >
              <SendHorizontal color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </XStack>
    </YStack>
  );
};

const styles = StyleSheet.create({
  input: {
    padding: 14,
    minHeight: 46,
    paddingRight: 64,
    borderRadius: 16,
    textAlignVertical: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default TextInputWithAvatar;
