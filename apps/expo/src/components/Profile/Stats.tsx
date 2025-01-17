import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { Href, useRouter } from "expo-router";
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
}

const StatItem = ({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading?: boolean;
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
    <YStack alignItems="center" gap="$1.5">
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
}: StatsProps) => {
  const router = useRouter();

  const navigateToSection = (section: string) => {
    if (isLoading) return;

    const basePath = userId ? "/connections" : "/self-connections";
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
      <TouchableOpacity
        onPress={() => navigateToSection("posts")}
        disabled={isLoading}
      >
        <StatItem label="Posts" value={postCount} isLoading={isLoading} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("following")}
        disabled={isLoading}
      >
        <StatItem
          label="Following"
          value={followingCount}
          isLoading={isLoading}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("followers")}
        disabled={isLoading}
      >
        <StatItem
          label="Followers"
          value={followerCount}
          isLoading={isLoading}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("friends")}
        disabled={isLoading}
      >
        <StatItem label="Friends" value={friendCount} isLoading={isLoading} />
      </TouchableOpacity>
    </XStack>
  );
};

export default Stats;
