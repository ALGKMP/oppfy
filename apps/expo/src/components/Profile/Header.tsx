import React from "react";
import { View, XStack, YStack } from "tamagui";

import type { RouterOutputs } from "@oppfy/api";

import Bio from "~/components/Profile/Bio";
import JoinDatePill from "~/components/Profile/JoinDatePill";
import ProfileActions from "~/components/Profile/ProfileActions";
import ProfileInfo from "~/components/Profile/ProfileInfo";
import QuickActions from "~/components/Profile/QuickActions";
import Stats from "~/components/Profile/Stats";

type Profile = RouterOutputs["profile"]["getProfile"];
type Stats = RouterOutputs["profile"]["getStats"];

type relationshipState =
  RouterOutputs["profile"]["getRelationshipStatesBetweenUsers"];

interface HeaderSelfProps {
  type: "self";
  profile: Profile;
  stats: Stats;
  isLoading: boolean;
}

interface HeaderOtherProps {
  type: "other";
  profile: Profile;
  stats: Stats;
  networkRelationships: relationshipState;
  isLoading: boolean;
}

type HeaderProps = HeaderSelfProps | HeaderOtherProps;

const Header = (props: HeaderProps) => (
  <YStack>
    {/* Cover Image Area */}
    <YStack
      height={100}
      overflow="hidden"
      borderRadius="$6"
      backgroundColor="$background"
    >
      <View position="absolute" bottom={12} right={12}>
        <JoinDatePill createdAt={props.profile.createdAt} />
      </View>
    </YStack>

    {/* Profile Info Section */}
    <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="flex-end">
        <ProfileInfo
          name={props.profile.name}
          username={props.profile.username}
          profilePictureUrl={props.profile.profilePictureUrl}
          isLoading={props.isLoading}
        />

        {props.type === "self" ? (
          <QuickActions
            type="self"
            userId={props.profile.userId}
            username={props.profile.username}
            profilePictureUrl={props.profile.profilePictureUrl}
            isLoading={props.isLoading}
          />
        ) : (
          <QuickActions
            type="other"
            userId={props.profile.userId}
            relationshipState={props.networkRelationships}
            username={props.profile.username}
            profilePictureUrl={props.profile.profilePictureUrl}
            isLoading={props.isLoading}
          />
        )}
      </XStack>

      {props.type === "self" ? (
        <ProfileActions type="self" userId={props.profile.userId} />
      ) : (
        <ProfileActions
          type="other"
          userId={props.profile.userId}
          relationshipState={props.networkRelationships}
        />
      )}

      {props.type === "self" ? (
        <Stats
          type="self"
          userId={props.profile.userId}
          username={props.profile.username}
          postCount={props.stats.posts}
          followingCount={props.stats.following}
          followerCount={props.stats.followers}
          friendCount={props.stats.friends}
          isLoading={props.isLoading}
        />
      ) : (
        <Stats
          type="other"
          userId={props.profile.userId}
          username={props.profile.username}
          postCount={props.stats.posts}
          followingCount={props.stats.following}
          followerCount={props.stats.followers}
          friendCount={props.stats.friends}
          isLoading={props.isLoading}
          relationshipState={props.networkRelationships}
        />
      )}
    </YStack>
  </YStack>
);

export default Header;
