import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Separator, Spacer, Text, View, YStack } from "tamagui";
import type { z } from "zod";

import type { trpcValidators } from "@oppfy/validators";

import PeopleCarousel from "~/components/Carousels/PeopleCarousel";
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
  isRestricted: boolean;
  isBlocked: boolean;
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
    isRestricted,
    isBlocked,
  } = props;

  const router = useRouter();

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
        {/* <PeopleCarousel loading /> */}
      </YStack>
    );
  }

  const hasFriends = profileData.friendCount > 0;

  const onPersonClick = ({
    userId,
    username,
  }: {
    userId: string;
    username: string;
  }) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/profile/[userId]/",
      params: {
        userId,
        username,
      },
    });
  };

  return (
    <YStack gap="$5">
      <YStack gap="$5">
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
            title="Friends🔥"
            showMore={friendsData.length < profileData.friendCount}
            onItemPress={onPersonClick}
            onShowMore={() => {
              // Handle show more friends
            }}
          />
        ) : (
          <PeopleCarousel
            loading={false}
            data={recommendationsData}
            title="Discover People🔥"
            showMore={recommendationsData.length > 0}
            onItemPress={onPersonClick}
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
