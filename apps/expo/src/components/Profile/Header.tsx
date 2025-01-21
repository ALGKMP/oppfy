import React from "react";
import { View, XStack, YStack } from "tamagui";

import type { RouterOutputs } from "@oppfy/api";

import Bio from "~/components/Profile/Bio";
import HeaderGradient from "~/components/Profile/HeaderGradient";
import JoinDatePill from "~/components/Profile/JoinDatePill";
import ProfileActions from "~/components/Profile/ProfileActions";
import ProfileInfo from "~/components/Profile/ProfileInfo";
import QuickActions from "~/components/Profile/QuickActions";
import Stats from "~/components/Profile/Stats";

type NetworkRelationships = RouterOutputs["profile"]["getNetworkRelationships"];

interface User {
  id?: string;
  name: string | null;
  username: string;
  profilePictureUrl: string | null;
  bio: string | null;
}

interface Stats {
  postCount: number;
  followingCount: number;
  followerCount: number;
  friendCount: number;
}

interface HeaderProps {
  user: User;
  stats: Stats;
  createdAt?: Date;
  networkRelationships?: NetworkRelationships;
  isLoading?: boolean;
}

const Header = ({
  user,
  stats,
  createdAt,
  networkRelationships,
  isLoading = false,
}: HeaderProps) => {
  const isBlocked = networkRelationships?.blocked ?? false;
  const isPrivate = networkRelationships?.privacy === "private";
  const isDisabled =
    isBlocked ||
    (isPrivate && networkRelationships.targetUserFollowState !== "Following");

  // Generate a unique key for HeaderGradient based on username
  const headerKey = `header-gradient-${user.username ?? "default"}`;

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack height={140} overflow="hidden" borderRadius="$6">
        <HeaderGradient
          key={headerKey}
          username={user.username}
          profilePictureUrl={user.profilePictureUrl}
        />
        <View position="absolute" bottom={12} right={12}>
          <JoinDatePill createdAt={createdAt} />
        </View>
      </YStack>

      {/* Profile Info Section */}
      <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-end">
          <ProfileInfo
            name={user.name}
            username={user.username}
            profilePictureUrl={user.profilePictureUrl}
            isLoading={isLoading}
          />
          <QuickActions
            userId={user.id}
            username={user.username}
            profilePictureUrl={user.profilePictureUrl}
            isLoading={isLoading}
            networkRelationships={networkRelationships}
          />
        </XStack>

        <Bio bio={user.bio} isLoading={isLoading} />

        <ProfileActions
          userId={user.id}
          isDisabled={isBlocked}
          networkRelationships={networkRelationships}
        />

        <Stats
          userId={user.id}
          username={user.username}
          postCount={stats.postCount}
          followingCount={stats.followingCount}
          followerCount={stats.followerCount}
          friendCount={stats.friendCount}
          isLoading={isLoading}
          disabled={isDisabled}
        />
      </YStack>
    </YStack>
  );
};

export default Header;
