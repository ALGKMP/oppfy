import React from "react";
import { BlurView } from "expo-blur";
import { Text, XStack } from "tamagui";

interface StatsButtonProps {
  count?: number;
  children: React.ReactNode;
}

const formatCount = (count: number) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const StatsButton = ({ count, children }: StatsButtonProps) => {
  return (
    <BlurView
      intensity={50}
      style={{
        padding: 4,
        borderRadius: 24,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
      }}
    >
      <XStack justifyContent="center" alignItems="center">
        {count !== undefined && count > 0 && (
          <Text color="white" paddingLeft="$2">
            {formatCount(count)}
          </Text>
        )}
        {children}
      </XStack>
    </BlurView>
  );
};
