import React from "react";
import { Text, YStack } from "tamagui";

import { Avatar } from "~/components/ui";
import { Skeleton } from "~/components/ui/Skeleton";

interface ProfileInfoProps {
  name: string | null | undefined;
  username: string | null | undefined;
  profilePictureUrl: string | null | undefined;
  isLoading: boolean;
}

const ProfileInfo = ({
  name,
  username,
  profilePictureUrl,
  isLoading,
}: ProfileInfoProps) => {
  return (
    <YStack>
      <Avatar source={profilePictureUrl} size={110} bordered />
      <YStack paddingTop="$3" gap="$1">
        {isLoading ? (
          <>
            <Skeleton width={150} height={28} />
            <Skeleton width={100} height={16} />
          </>
        ) : (
          <>
            <Text height={28} fontWeight="700" fontSize="$7" color="$color">
              {name}
            </Text>
            <Text height={16} fontSize="$3" color="$color" opacity={0.6}>
              @{username}
            </Text>
          </>
        )}
      </YStack>
    </YStack>
  );
};

export default ProfileInfo;
