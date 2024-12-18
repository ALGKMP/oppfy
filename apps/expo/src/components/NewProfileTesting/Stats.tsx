import { YStack, XStack, Text } from "~/components/ui";
import { TouchableOpacity } from "react-native";
import { useSession } from "~/contexts/SessionContext";

import { useState } from "react";

import { abbreviatedNumber } from "@oppfy/utils";
import { useRouter } from "expo-router";

interface StatsProps {
  userId: string;
  followingCount: number;
  followerCount: number;
}

const Stats = ({ userId, followingCount, followerCount }: StatsProps) => {

  /*
   * Notice how we just have one state variable for the entire component.
   * We don't have a wall of state or wall of functions,
   * we just have a single state variable and a single function.
   * This keeps our components simple and easy to understand.
   */

  const { onFollowingPress, onFollowersPress } = useOnFollowPress({
    userId,
  });

  /*
   * TODO: Some isRestricted state (this would be related to if the users's private and we don't follow, or they're blocked)
   * Either pass this in as a prop, or set it in a hook.
   * Gonna decide later.
   */
  const [isRestricted, setIsRestricted] = useState(false);

  return (
    <YStack alignItems="flex-end" gap="$2">
      <TouchableOpacity onPress={onFollowingPress} disabled={isRestricted}>
        <Stat
          label="Following"
          value={abbreviatedNumber(followingCount)}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onFollowersPress} disabled={isRestricted}>
        <Stat
          label="Followers"
          value={abbreviatedNumber(followerCount)}
        />
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
        router.push("/self-profile/connections/following-list");
      },
      onFollowersPress: () => {
        router.push("/self-profile/connections/followers-list");
      },
    };
  }
  return {
    onFollowingPress: () => {
      router.push("/self-profile/connections/following-list");
    },
    onFollowersPress: () => {
      router.push("/self-profile/connections/followers-list");
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
