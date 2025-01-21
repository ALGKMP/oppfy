import React from "react";
import { View, XStack, YStack } from "tamagui";

import { RouterOutputs } from "@oppfy/api";

import Bio from "~/components/Profile/Bio";
import HeaderGradient from "~/components/Profile/HeaderGradient";
import JoinDatePill from "~/components/Profile/JoinDatePill";
import ProfileActions from "~/components/Profile/ProfileActions";
import ProfileInfo from "~/components/Profile/ProfileInfo";
import QuickActions from "~/components/Profile/QuickActions";
import Stats from "~/components/Profile/Stats";
import { H3 } from "../ui";

type NetworkRelationships = RouterOutputs["profile"]["getNetworkRelationships"];

interface HeaderProps {
  userId?: string;
  name?: string | null;
  username?: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  createdAt?: Date;
  postCount?: number;
  followingCount?: number;
  followerCount?: number;
  friendCount?: number;
  isLoading?: boolean;
  networkRelationships?: NetworkRelationships;
}

const Header = ({
  userId,
  name,
  username,
  profilePictureUrl,
  bio,
  createdAt,
  postCount = 0,
  followingCount = 0,
  followerCount = 0,
  friendCount = 0,
  isLoading = false,
  networkRelationships,
}: HeaderProps) => {
  const isBlocked = networkRelationships?.blocked ?? false;

  // Generate a unique key for HeaderGradient based on username
  const headerKey = `header-gradient-${username ?? "default"}`;

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack height={140} overflow="hidden" borderRadius="$6">
        <HeaderGradient
          key={headerKey}
          username={username}
          profilePictureUrl={profilePictureUrl}
        />
        <View position="absolute" bottom={12} right={12}>
          <JoinDatePill createdAt={createdAt} />
        </View>
      </YStack>

      {/* Profile Info Section */}
      <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-end">
          <ProfileInfo
            name={name}
            username={username}
            profilePictureUrl={profilePictureUrl}
            isLoading={isLoading}
          />
          <QuickActions
            userId={userId}
            username={username}
            profilePictureUrl={profilePictureUrl}
            isLoading={isLoading}
            networkRelationships={networkRelationships}
          />
        </XStack>

        <Bio bio={bio} isLoading={isLoading} />

        <ProfileActions
          userId={userId}
          isDisabled={isBlocked}
          networkRelationships={networkRelationships}
        />

        {!isBlocked && (
          <Stats
            userId={userId}
            username={username}
            postCount={postCount}
            followingCount={followingCount}
            followerCount={followerCount}
            friendCount={friendCount}
            isLoading={isLoading}
          />
        )}
      </YStack>
    </YStack>
  );
};

export default Header;
