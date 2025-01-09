import React from "react";
import { View, XStack, YStack } from "tamagui";

import Bio from "~/components/Profile/Bio";
import HeaderGradient from "~/components/Profile/HeaderGradient";
import JoinDatePill from "~/components/Profile/JoinDatePill";
import ProfileActions from "~/components/Profile/ProfileActions";
import ProfileInfo from "~/components/Profile/ProfileInfo";
import QuickActions from "~/components/Profile/QuickActions";
import Stats from "~/components/Profile/Stats";
import useProfile from "~/hooks/useProfile";

interface HeaderProps {
  userId?: string;
}

const Header = ({ userId }: HeaderProps = { userId: undefined }) => {
  const { profile: profileData, isLoading: isLoadingProfileData } = useProfile({
    userId,
  });

  const defaultProfile = {
    name: undefined,
    username: undefined,
    bio: undefined,
    profilePictureUrl: undefined,
    followingCount: 0,
    followerCount: 0,
    friendCount: 0,
    postCount: 0,
    createdAt: undefined,
  };

  const profile = profileData ?? defaultProfile;

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack height={140} overflow="hidden" borderRadius="$6">
        <HeaderGradient
          username={profile.username}
          profilePictureUrl={profile.profilePictureUrl}
        />
        <View position="absolute" bottom={12} right={12}>
          <JoinDatePill createdAt={profile.createdAt} />
        </View>
      </YStack>

      {/* Profile Info Section */}
      <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-end">
          <ProfileInfo
            name={profile.name}
            username={profile.username}
            profilePictureUrl={profile.profilePictureUrl}
            isLoading={isLoadingProfileData}
          />
          <QuickActions userId={userId} isLoading={isLoadingProfileData} />
        </XStack>

        <Bio bio={profile.bio} isLoading={isLoadingProfileData} />

        <ProfileActions userId={userId} />

        <Stats
          userId={userId}
          username={profile.username}
          postCount={profile.postCount}
          followingCount={profile.followingCount}
          followerCount={profile.followerCount}
          friendCount={profile.friendCount}
          isLoading={isLoadingProfileData}
        />
      </YStack>
    </YStack>
  );
};

export default Header;
