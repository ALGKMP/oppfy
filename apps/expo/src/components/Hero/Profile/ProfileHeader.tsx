import { Spacer, Text, View, YStack } from "tamagui";
import type { z } from "zod";

import type { trpcValidators } from "@oppfy/validators";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
import ProfileHeaderDetailsOther from "./components/ProfileHeaderDetailsOther";
import ProfileHeaderDetailsSelf from "./components/ProfileHeaderDetailsSelf";

// Define types at the top of the file
type FullProfileOther = z.infer<
  typeof trpcValidators.output.profile.fullProfileOther
>;
type FullProfileSelf = z.infer<
  typeof trpcValidators.output.profile.fullProfileSelf
>;
type FriendItems = z.infer<typeof trpcValidators.output.friend.friendItems>;
type FriendItemsOther = z.infer<
  typeof trpcValidators.output.friend.friendItemsOther
>;
type RecommendedProfiles = z.infer<
  typeof trpcValidators.output.recommendations.recommededProfiles
>;

interface NavigateProfileParams {
  userId: string;
  username: string;
}

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
  navigateToProfile: (params: NavigateProfileParams) => void;
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
        <PeopleCarousel
          loading
          data={[]}
          onItemPress={() => {}}
          onShowMore={() => {}}
        />
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
            emoji="🔥"
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
