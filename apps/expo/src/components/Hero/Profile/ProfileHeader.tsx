import { useEffect } from "react";
import { Spacer, Text, View, YStack } from "tamagui";
import type { z } from "zod";

import type { sharedValidators } from "@oppfy/validators";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import ProfileHeaderDetailsOther from "./components/ProfileHeaderDetailsOther";
import ProfileHeaderDetailsSelf from "./components/ProfileHeaderDetailsSelf";

// Define types at the top of the file
type FullProfileOther = z.infer<typeof sharedValidators.user.fullProfileOther>;
type FullProfileSelf = z.infer<typeof sharedValidators.user.fullProfileSelf>;
type FriendItems = z.infer<typeof sharedValidators.user.friendItems>;
type FriendItemsOther = z.infer<typeof sharedValidators.user.friendItemsOther>;
type RecommendedProfiles = z.infer<
  typeof sharedValidators.user.recommededProfiles
>;

interface ProfileHeaderProps {
  isSelfProfile: boolean;
  isLoadingProfileData: boolean;
  isLoadingFriendsData: boolean;
  isLoadingRecommendationsData: boolean;
  profileData: FullProfileOther | FullProfileSelf | undefined;
  friendsData: FriendItems | FriendItemsOther | undefined;
  recommendationsData: RecommendedProfiles | undefined;
  isRestricted: boolean;
  isBlocked: boolean;
  navigateToProfile: ({
    userId,
    username,
  }: {
    userId: string;
    username: string;
  }) => void;
}

function isOtherProfile(
  profile: ProfileHeaderProps["profileData"],
): profile is FullProfileOther {
  return profile !== undefined && "networkStatus" in profile;
}

const ProfileHeader = (props: ProfileHeaderProps) => {
  const {
    isSelfProfile,
    isLoadingProfileData,
    isLoadingFriendsData,
    isLoadingRecommendationsData,
    profileData,
    friendsData,
    recommendationsData,
    isRestricted,
    isBlocked,
  } = props;

  if (
    isLoadingProfileData ||
    isLoadingFriendsData ||
    isLoadingRecommendationsData ||
    profileData === undefined ||
    friendsData === undefined ||
    recommendationsData === undefined
  ) {
    return (
      <YStack gap="$5">
        <ProfileHeaderDetailsSelf loading />
        <PeopleCarousel loading />
      </YStack>
    );
  }

  const hasFriends = profileData.friendCount > 0;

  return (
    <YStack>
      <YStack gap="$4">
        {isSelfProfile ? (
          <ProfileHeaderDetailsSelf
            loading={false}
            data={profileData as FullProfileSelf}
          />
        ) : isOtherProfile(profileData) ? (
          <ProfileHeaderDetailsOther
            loading={false}
            data={profileData}
            isRestricted={isRestricted}
            isBlocked={isBlocked}
          />
        ) : (
          <View>
            <Text>Error because of some dumb shit</Text>
          </View>
        )}
        {hasFriends ? (
          <PeopleCarousel
            loading={false}
            data={friendsData}
            title="Friends 🔥"
            showMore={friendsData.length < profileData.friendCount}
            onItemPress={props.navigateToProfile}
            onShowMore={() => {
              // Handle show more friends
            }}
          />
        ) : (
          <PeopleCarousel
            loading={false}
            data={recommendationsData}
            title="Suggestions"
            showMore={recommendationsData.length > 0}
            onItemPress={props.navigateToProfile}
            onShowMore={() => {
              // Handle show more recommendations
            }}
          />
        )}
      </YStack>
      {/* <Separator /> */}
      <Spacer size="$1" />
    </YStack>
  );
};

export default ProfileHeader;
