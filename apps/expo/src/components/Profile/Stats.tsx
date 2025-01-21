import { useState } from "react";
import { TouchableOpacity } from "react-native";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { Text, XStack, YStack } from "tamagui";

import { Skeleton } from "~/components/ui/Skeleton";

interface StatsProps {
  userId?: string;
  username: string | null | undefined;
  postCount: number;
  followingCount: number;
  followerCount: number;
  friendCount: number;
  isLoading: boolean;
  disabled?: boolean;
}

const StatItem = ({
  label,
  value,
  isLoading,
  disabled,
}: {
  label: string;
  value: number;
  isLoading?: boolean;
  disabled?: boolean;
}) => {
  if (isLoading) {
    return (
      <YStack alignItems="center" gap="$1.5">
        <Skeleton width={40} height={24} />
        <Skeleton width={60} height={14} />
      </YStack>
    );
  }

  return (
    <YStack alignItems="center" gap="$1.5" opacity={disabled ? 0.5 : 1}>
      <Text fontWeight="700" fontSize="$6" color="$color">
        {value}
      </Text>
      <Text fontSize="$2" color="$color" opacity={0.6} fontWeight="500">
        {label}
      </Text>
    </YStack>
  );
};

const Stats = ({
  userId,
  username,
  postCount,
  followingCount,
  followerCount,
  friendCount,
  isLoading,
  disabled = false,
}: StatsProps) => {
  const router = useRouter();

  const navigateToSection = (section: string) => {
    if (isLoading || disabled) return;

    const basePath = userId ? "/other-connections" : "/self-connections";
    router.push({
      pathname: `${basePath}/${section}`,
      ...(userId && { params: { userId, username } }),
    } as Href);
  };

  return (
    <XStack
      paddingVertical="$4"
      marginHorizontal="$-2"
      justifyContent="space-around"
      backgroundColor="$background"
      borderRadius="$8"
      borderWidth={1}
      borderColor="$borderColor"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.05}
      shadowRadius={8}
      elevation={2}
      opacity={isLoading ? 0.8 : 1}
    >
      <TouchableOpacity disabled={true}>
        <StatItem
          label="Posts"
          value={postCount}
          isLoading={isLoading}
          disabled={disabled}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("following")}
        disabled={isLoading || disabled}
      >
        <StatItem
          label="Following"
          value={followingCount}
          isLoading={isLoading}
          disabled={disabled}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("followers")}
        disabled={isLoading || disabled}
      >
        <StatItem
          label="Followers"
          value={followerCount}
          isLoading={isLoading}
          disabled={disabled}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("friends")}
        disabled={isLoading || disabled}
      >
        <StatItem
          label="Friends"
          value={friendCount}
          isLoading={isLoading}
          disabled={disabled}
        />
      </TouchableOpacity>
    </XStack>
  );
};

export default Stats;
