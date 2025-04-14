import React from "react";
import { View, XStack, YStack } from "tamagui";

import type { RouterOutputs } from "@oppfy/api";

import Bio from "~/components/Profile/Bio";
import JoinDatePill from "~/components/Profile/JoinDatePill";
import ProfileActions from "~/components/Profile/ProfileActions";
import ProfileInfo from "~/components/Profile/ProfileInfo";
import QuickActions from "~/components/Profile/QuickActions";
import Stats from "~/components/Profile/Stats";

type NetworkRelationships =
  RouterOutputs["profile"]["getRelationshipStatesBetweenUsers"];

type Privacy = RouterOutputs["profile"]["getProfile"]["privacy"];

interface User {
  id?: string;
  name: string | null;
  username: string;
  profilePictureUrl: string | null;
  bio: string | null;
  privacy: Privacy;
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
  const isBlocked = networkRelationships?.isBlocked ?? false;
  const isDisabled =
    isBlocked ||
    (user.privacy === "private" &&
      networkRelationships?.follow !== "FOLLOWING");

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack
        height={100}
        overflow="hidden"
        borderRadius="$6"
        backgroundColor="$background"
      >
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

        <ProfileActions
          userId={user.id}
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
