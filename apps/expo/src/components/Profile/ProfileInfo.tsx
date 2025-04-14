import React from "react";
import { Text, YStack } from "tamagui";

import { Avatar } from "~/components/ui";
import { Skeleton } from "~/components/ui/Skeleton";
import type { RouterOutputs } from "~/utils/api";

type Profile = RouterOutputs["profile"]["getProfile"];

interface ProfileInfoProps {
  profile: Profile | undefined;
  isLoading: boolean;
}

const ProfileInfo = ({ profile, isLoading }: ProfileInfoProps) => {
  return (
    <YStack>
      {profile?.profilePictureUrl ? (
        <Avatar source={profile.profilePictureUrl} size={110} bordered />
      ) : isLoading ? (
        <Skeleton size={110} circular />
      ) : (
        <Avatar source={null} size={110} bordered />
      )}

      <YStack paddingTop="$3" gap="$1">
        {profile?.name ? (
          <Text height={28} fontWeight="700" fontSize="$7" color="$color">
            {profile.name}
          </Text>
        ) : (
          <Skeleton width={150} height={28} />
        )}

        {profile?.username ? (
          <Text height={16} fontSize="$3" color="$color" opacity={0.6}>
            @{profile.username}
          </Text>
        ) : (
          <Skeleton width={100} height={16} />
        )}
      </YStack>
    </YStack>
  );
};

export default ProfileInfo;
