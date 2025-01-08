import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text, XStack, YStack } from "tamagui";

interface StatsProps {
  userId?: string;
  username?: string;
  postCount: number;
  followingCount: number;
  followerCount: number;
  friendCount: number;
}

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <YStack alignItems="center" gap="$1.5">
    <Text fontWeight="700" fontSize="$6" color="$color">
      {value}
    </Text>
    <Text fontSize="$2" color="$color" opacity={0.6} fontWeight="500">
      {label}
    </Text>
  </YStack>
);

const Stats = ({
  userId,
  username,
  postCount,
  followingCount,
  followerCount,
  friendCount,
}: StatsProps) => {
  const router = useRouter();

  const navigateToSection = (section: string) => {
    const basePath = userId
      ? "/profile/connections"
      : "/self-profile/connections";
    router.push({
      pathname: `${basePath}/${section}` as any,
      ...(userId && { params: { userId, username } }),
    });
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
    >
      <TouchableOpacity onPress={() => navigateToSection("posts")}>
        <StatItem label="Posts" value={postCount} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateToSection("following")}>
        <StatItem label="Following" value={followingCount} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateToSection("followers")}>
        <StatItem label="Followers" value={followerCount} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateToSection("friends")}>
        <StatItem label="Friends" value={friendCount} />
      </TouchableOpacity>
    </XStack>
  );
};

export default Stats;
