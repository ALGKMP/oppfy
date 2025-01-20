import React, { useState } from "react";
import { View, XStack, YStack } from "tamagui";

import Bio from "~/components/Profile/Bio";
import HeaderGradient from "~/components/Profile/HeaderGradient";
import JoinDatePill from "~/components/Profile/JoinDatePill";
import ProfileActions from "~/components/Profile/ProfileActions";
import ProfileInfo from "~/components/Profile/ProfileInfo";
import QuickActions from "~/components/Profile/QuickActions";
import Stats from "~/components/Profile/Stats";
import useProfile from "~/hooks/useProfile";
import { api } from "~/utils/api";
import { H3 } from "../ui";

interface HeaderProps {
  userId?: string;
  name?: string | undefined;
  username?: string | undefined;
  profilePictureUrl?: string | undefined;
}

const Header = (
  { userId, name, username, profilePictureUrl }: HeaderProps = {
    userId: undefined,
  },
) => {
  const { profile: profileData, isLoading: isLoadingProfileData } = useProfile({
    userId,
  });

  const { data: networkRelationships } =
    api.profile.getNetworkRelationships.useQuery(
      { userId: userId ?? "" },
      { enabled: !!userId },
    );

  // const profile = profileData ?? defaultProfile;
  const isBlocked = networkRelationships?.blocked ?? false;

  // Generate a unique key for HeaderGradient based on username
  const headerKey = `header-gradient-${profileData?.username ?? "default"}`;

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack height={140} overflow="hidden" borderRadius="$6">
        <HeaderGradient
          key={headerKey}
          username={profileData?.username ?? username}
          profilePictureUrl={
            profileData?.profilePictureUrl ?? profilePictureUrl
          }
        />
        <View position="absolute" bottom={12} right={12}>
          <JoinDatePill createdAt={profileData?.createdAt ?? undefined} />
        </View>
        <View
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          alignItems="center"
          justifyContent="center"
        >
          {!userId && <H3></H3>}
        </View>
      </YStack>

      {/* Profile Info Section */}
      <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-end">
          <ProfileInfo
            name={profileData?.name ?? name}
            username={profileData?.username ?? username}
            profilePictureUrl={
              profileData?.profilePictureUrl ?? profilePictureUrl
            }
          />
          <QuickActions
            userId={userId}
            username={profileData?.username ?? username}
            profilePictureUrl={
              profileData?.profilePictureUrl ?? profilePictureUrl
            }
            isLoading={isLoadingProfileData}
            networkRelationships={networkRelationships}
          />
        </XStack>

        <Bio
          bio={profileData?.bio ?? undefined}
          isLoading={isLoadingProfileData}
        />

        <ProfileActions
          userId={userId}
          isDisabled={isBlocked}
          networkRelationships={networkRelationships}
        />

        {!isBlocked && (
          <Stats
            userId={userId}
            username={profileData?.username ?? username}
            postCount={profileData?.postCount ?? 0}
            followingCount={profileData?.followingCount ?? 0}
            followerCount={profileData?.followerCount ?? 0}
            friendCount={profileData?.friendCount ?? 0}
            isLoading={isLoadingProfileData}
          />
        )}
      </YStack>
    </YStack>
  );
};

export default Header;
