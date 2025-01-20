import React from "react";
import { Text, YStack } from "tamagui";

import { Avatar } from "~/components/ui";
import { Skeleton } from "~/components/ui/Skeleton";

interface ProfileInfoProps {
  name: string | null | undefined;
  username: string | null | undefined;
  profilePictureUrl: string | null | undefined;
}

const ProfileInfo = ({
  name,
  username,
  profilePictureUrl,
}: ProfileInfoProps) => {
  console.log("name", name);
  console.log("username", username);
  console.log("profilePictureUrl", profilePictureUrl);
  return (
    <YStack>
      {profilePictureUrl ? (
        <Avatar source={profilePictureUrl} size={110} bordered />
      ) : (
        <Skeleton size={110} circular />
      )}

      <YStack paddingTop="$3" gap="$1">
        {name ? (
          <Text height={28} fontWeight="700" fontSize="$7" color="$color">
            {name}
          </Text>
        ) : (
          <Skeleton width={150} height={28} />
        )}

        {username ? (
          <Text height={16} fontSize="$3" color="$color" opacity={0.6}>
            @{username}
          </Text>
        ) : (
          <Skeleton width={100} height={16} />
        )}
      </YStack>
    </YStack>
  );
};

export default ProfileInfo;
