import { Separator, Text, View, YStack } from "tamagui";
import type { z } from "zod";

import type { trpcValidators } from "@oppfy/validators";

import FriendsCarousel from "../../Carousels/FriendsCarousel";
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

interface ProfileHeaderProps {
  isSelfProfile: boolean;
  isLoadingProfileData: boolean;
  isLoadingFriendsData: boolean;
  isLoadingRecommendationsData: boolean;
  profileData: FullProfileOther | FullProfileSelf | undefined;
  friendsData: FriendItems | FriendItemsOther | undefined;
  recommendationsData: RecommendedProfiles | undefined;
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
    recommendationsData: recommendationsData,
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
        <FriendsCarousel loading />
      </YStack>
    );
  }
  return (
    <YStack gap="$5">
      <YStack gap="$5">
        {isSelfProfile ? (
          <ProfileHeaderDetailsSelf
            loading={false}
            data={profileData as FullProfileSelf}
          />
        ) : isOtherProfile(profileData) ? (
          <ProfileHeaderDetailsOther loading={false} data={profileData} />
        ) : (
          <View>
            <Text>Error because of some dumb shit</Text>
          </View>
        )}
        <FriendsCarousel
          loading={false}
          friendsData={{
            friendCount: profileData.friendCount,
            friendItems: friendsData,
          }}
          reccomendationsData={recommendationsData}
        />
      </YStack>
      <Separator />
    </YStack>
  );
};

export default ProfileHeader;
