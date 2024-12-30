import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { abbreviatedNumber } from "@oppfy/utils";

import { Text, XStack, YStack } from "~/components/ui";

interface StatsProps {
  userId?: string;
  followingCount: number;
  followerCount: number;
  disableButtons?: boolean;
}

const Stats = ({ userId, followingCount, followerCount, disableButtons }: StatsProps) => {

  const { onFollowingPress, onFollowersPress } = useOnFollowPress({
    userId,
  });

  return (
    <YStack alignItems="flex-end" gap="$2">
      <TouchableOpacity onPress={onFollowingPress} disabled={disableButtons}>
        <Stat label="Following" value={abbreviatedNumber(followingCount)} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onFollowersPress} disabled={disableButtons}>
        <Stat label="Followers" value={abbreviatedNumber(followerCount)} />
      </TouchableOpacity>
    </YStack>
  );
};

/*
 * ==========================================
 * ============== Hooks =====================
 * ==========================================
 */

/**
 * A hook that returns the functions to navigate to the following and followers list
 *
 * @param {string} userId - The userId of the user
 * @returns {onFollowingPress: () => void, onFollowersPress: () => void}
 */
const useOnFollowPress = ({ userId }: { userId?: string } = {}) => {
  const router = useRouter();
  if (userId) {
    return {
      onFollowingPress: () => { 
        router.push({pathname: `/profile/connections/following`, params: {
          userId,
        }})
      },
      onFollowersPress: () => {
        router.push({pathname: `/profile/connections/followers`, params: {
          userId,
        }})
      },
    };
  }
  return {
    onFollowingPress: () => {
      router.push("/self-profile/connections/following");
    },
    onFollowersPress: () => {
      router.push("/self-profile/connections/followers");
    },
  };
};

/*
 * ==========================================
 * ============== UI Components =============
 * ==========================================
 */

interface StatProps {
  label: string;
  value: string | number;
}

/**
 * A UI component that displays a stat with a label and a value.
 *
 * @param {StatProps} props - The props for the Stat component
 * @returns {JSX.Element} The Stat component
 */
const Stat = (props: StatProps) => (
  <XStack gap="$1">
    <Text theme="alt1" lineHeight={0}>
      {props.label}{" "}
    </Text>
    <Text fontWeight="bold" lineHeight={0}>
      {props.value}
    </Text>
  </XStack>
);

export default Stats;
