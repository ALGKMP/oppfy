import { YStack } from "tamagui";
import type { z } from "zod";

import type { trpcValidators } from "@oppfy/validators";

import FriendsCarousel from "../../Carousels/FriendsCarousel";
import ProfileBanner from "./ProfileBanner";

interface ProfileHeaderProps {
  isLoadingProfileData: boolean;
  isLoadingFriendsData: boolean;
  isLoadingRecommendationsData: boolean;
  profileData:
    | z.infer<typeof trpcValidators.output.profile.fullProfileSelf>
    | undefined;
  friendsData:
    | z.infer<typeof trpcValidators.output.friend.friendItems>
    | undefined;
  recommendationsData:
    | z.infer<typeof trpcValidators.output.recommendations.recommededProfiles>
    | undefined;
}

const ProfileHeader = (props: ProfileHeaderProps) => {
  const {
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
        <ProfileBanner loading />
        <FriendsCarousel loading />
      </YStack>
    );
  }
  return (
    <YStack gap="$5" marginBottom="$5">
      <YStack gap="$5">
        <ProfileBanner loading={false} data={profileData} />
        <FriendsCarousel
          loading={false}
          friendsData={{
            friendCount: profileData.friendCount,
            friendItems: friendsData,
          }}
          reccomendationsData={recommendationsData}
        />
      </YStack>
    </YStack>
  );
};

export default ProfileHeader;
