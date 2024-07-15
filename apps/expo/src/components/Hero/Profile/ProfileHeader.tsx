import { YStack } from "tamagui";
import type { z } from "zod";

import type { trpcValidators } from "@oppfy/validators";

import FriendsCarousel from "../../Carousels/FriendsCarousel";
import ProfileBanner from "./ProfileBanner";

interface ProfileHeaderProps {
  isLoadingProfileData: boolean;
  isLoadingFriendsData: boolean;
  isLoadingRecomendationsData: boolean;
  profileData:
    | z.infer<typeof trpcValidators.output.profile.fullProfileSelf>
    | undefined;
  friendsData:
    | z.infer<typeof trpcValidators.output.friend.friendItems>
    | undefined;
  recomendationsData:
    | z.infer<typeof trpcValidators.output.recommendations.recommededProfiles>
    | undefined;
}

const ProfileHeaderProps = (props: ProfileHeaderProps) => {
  const {
    isLoadingProfileData,
    isLoadingFriendsData,
    isLoadingRecomendationsData,
    profileData,
    friendsData,
    recomendationsData,
  } = props;
  if (
    isLoadingProfileData ||
    isLoadingFriendsData ||
    isLoadingRecomendationsData ||
    profileData === undefined ||
    friendsData === undefined ||
    recomendationsData === undefined
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
          reccomendationsData={recomendationsData}
        />
      </YStack>
    </YStack>
  );
};

export default ProfileHeaderProps;
