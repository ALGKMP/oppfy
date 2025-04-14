import { TouchableOpacity } from "react-native";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { Text, XStack, YStack } from "tamagui";

import { Skeleton } from "~/components/ui/Skeleton";
import type { RouterOutputs } from "~/utils/api";

type RelationshipState =
  RouterOutputs["profile"]["getRelationshipStatesBetweenUsers"];

interface StatsSelfProps {
  type: "self";
  userId: string;
  username: string | null | undefined;
  postCount: number;
  followingCount: number;
  followerCount: number;
  friendCount: number;
  isLoading: boolean;
}

interface StatsOtherProps {
  type: "other";
  userId: string;
  username: string | null | undefined;
  postCount: number;
  followingCount: number;
  followerCount: number;
  friendCount: number;
  isLoading: boolean;
  relationshipState: RelationshipState;
}

type StatsProps = StatsSelfProps | StatsOtherProps;

const Stats = (props: StatsProps) => {
  const router = useRouter();
  const isDisabled =
    props.type === "other" &&
    (props.relationshipState.isBlocked ||
      (props.relationshipState.privacy === "PRIVATE" &&
        props.relationshipState.follow !== "FOLLOWING"));

  const navigateToSection = (section: string) => {
    const basePath =
      props.type === "self" ? "/self-connections" : "/other-connections";

    router.push({
      pathname: `${basePath}/${section}`,
      ...(props.type === "other" && {
        params: { userId: props.userId, username: props.username },
      }),
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
      opacity={props.isLoading ? 0.8 : 1}
    >
      <TouchableOpacity disabled={true}>
        <StatItem
          label="Posts"
          value={props.postCount}
          isLoading={props.isLoading}
          disabled={isDisabled}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("following")}
        disabled={props.isLoading || isDisabled}
      >
        <StatItem
          label="Following"
          value={props.followingCount}
          isLoading={props.isLoading}
          disabled={isDisabled}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("followers")}
        disabled={props.isLoading || isDisabled}
      >
        <StatItem
          label="Followers"
          value={props.followerCount}
          isLoading={props.isLoading}
          disabled={isDisabled}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigateToSection("friends")}
        disabled={props.isLoading || isDisabled}
      >
        <StatItem
          label="Friends"
          value={props.friendCount}
          isLoading={props.isLoading}
          disabled={isDisabled}
        />
      </TouchableOpacity>
    </XStack>
  );
};

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

export default Stats;
