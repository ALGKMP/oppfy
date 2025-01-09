import React from "react";
import { useRouter } from "expo-router";
import { Send, Settings2 } from "@tamagui/lucide-icons";
import { XStack } from "tamagui";

import { Button } from "~/components/ui";

interface QuickActionsProps {
  userId?: string;
  isLoading: boolean;
}

const QuickActions = ({ userId, isLoading }: QuickActionsProps) => {
  const router = useRouter();

  if (!userId) {
    return (
      <XStack gap="$3" paddingBottom="$1">
        <Button
          icon={<Settings2 size={20} />}
          variant="outlined"
          size="$3.5"
          circular
          borderWidth={1.5}
          onPress={() => router.push("/(app)/(settings)")}
          disabled={isLoading}
          opacity={isLoading ? 0.5 : 1}
        />
      </XStack>
    );
  }

  return (
    <XStack gap="$3" paddingBottom="$1">
      <Button
        icon={<Send size={20} />}
        variant="outlined"
        size="$3.5"
        circular
        borderWidth={1.5}
        disabled={isLoading}
        opacity={isLoading ? 0.5 : 1}
      />
    </XStack>
  );
};

export default QuickActions;
