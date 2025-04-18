import React from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

import type { RouterOutputs } from "@oppfy/api";

import Bio from "~/components/Profile/Bio";
import JoinDatePill from "~/components/Profile/JoinDatePill";
import ProfileActions from "~/components/Profile/ProfileActions";
import ProfileInfo from "~/components/Profile/ProfileInfo";
import QuickActions from "~/components/Profile/QuickActions";
import Stats from "~/components/Profile/Stats";

type Profile = RouterOutputs["profile"]["getProfile"];
type ProfileStats = RouterOutputs["profile"]["getStats"];

type RelationshipState =
  RouterOutputs["profile"]["getRelationshipStatesBetweenUsers"];

interface HeaderSelfProps {
  type: "self";
  profile: Profile | undefined;
  stats: ProfileStats | undefined;
  isLoading: boolean;
}

interface HeaderOtherProps {
  type: "other";
  profile: Partial<Profile> | undefined;
  stats: ProfileStats | undefined;
  relationshipState: RelationshipState | undefined;
  isLoading: boolean;
}

type HeaderProps = HeaderSelfProps | HeaderOtherProps;

const Header = (props: HeaderProps) => (
  <YStack>
    {/* Cover Image Area */}
    <YStack
      height={140}
      overflow="hidden"
      borderRadius="$6"
      backgroundColor="$primary"
      position="relative"
    >
      <LinearGradient
        colors={["$primary", "$background"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Profile Highlights */}
      <XStack
        position="absolute"
        bottom={12}
        right={12}
        justifyContent="space-between"
        alignItems="center"
      >
        <JoinDatePill createdAt={props.profile?.createdAt} />
      </XStack>
    </YStack>

    {/* Profile Info Section */}
    <YStack marginTop={-70} paddingHorizontal="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="flex-end">
        <ProfileInfo profile={props.profile} isLoading={props.isLoading} />

        {props.type === "self" ? (
          <QuickActions
            type="self"
            profile={props.profile}
            isLoading={props.isLoading}
          />
        ) : (
          <QuickActions
            type="other"
            profile={props.profile}
            relationshipState={props.relationshipState}
            isLoading={props.isLoading}
          />
        )}
      </XStack>

      <Bio bio={props.profile?.bio} isLoading={props.isLoading} />

      {props.type === "self" ? (
        <ProfileActions type="self" userId={props.profile?.userId} />
      ) : (
        <ProfileActions
          type="other"
          userId={props.profile?.userId}
          relationshipState={props.relationshipState}
        />
      )}

      {props.type === "self" ? (
        <Stats
          type="self"
          profile={props.profile}
          stats={props.stats}
          isLoading={props.isLoading}
        />
      ) : (
        <Stats
          type="other"
          profile={props.profile}
          stats={props.stats}
          isLoading={props.isLoading}
          relationshipState={props.relationshipState}
        />
      )}
    </YStack>
  </YStack>
);

export default Header;
