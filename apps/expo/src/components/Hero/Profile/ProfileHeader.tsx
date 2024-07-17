import { Text, View, YStack } from "tamagui";
import { z } from "zod";

import { trpcValidators } from "@oppfy/validators";

import FriendsCarousel from "../../Carousels/FriendsCarousel";
import ProfileDetailsSelf from "./ProfileDetails";
import ProfileDetailsOther from "./ProfileDetailsOther";

interface ProfileHeaderProps {
  isSelfProfile: boolean;
  isLoadingProfileData: boolean;
  isLoadingFriendsData: boolean;
  isLoadingRecommendationsData: boolean;
  profileData:
    | z.infer<typeof trpcValidators.output.profile.fullProfileOther>
    | z.infer<typeof trpcValidators.output.profile.fullProfileSelf>
    | undefined;
  friendsData:
    | z.infer<typeof trpcValidators.output.friend.friendItems>
    | undefined;
  recommendationsData:
    | z.infer<typeof trpcValidators.output.recommendations.recommededProfiles>
    | undefined;
}

function isOtherProfile(
  profile: ProfileHeaderProps["profileData"],
): profile is z.infer<typeof trpcValidators.output.profile.fullProfileOther> {
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
        <ProfileDetailsSelf loading />
        <FriendsCarousel loading />
      </YStack>
    );
  }
  return (
    <YStack gap="$5" marginBottom="$5">
      <YStack gap="$5">
        {isSelfProfile ? (
          <ProfileDetailsSelf loading={false} data={profileData} />
        ) : isOtherProfile(profileData) ? (
          <ProfileDetailsOther loading={false} data={profileData} />
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
    </YStack>
  );
};

export default ProfileHeader;
