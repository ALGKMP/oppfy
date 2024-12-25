import Avatar from "~/components/Avatar";
import { Skeleton } from "~/components/Skeletons";
import { Paragraph, SizableText, View, XStack, YStack } from "~/components/ui";
import useProfile from "~/hooks/useProfile";
import ActionButton from "./ActionButton";
import Stats from "./Stats";

interface HeaderProps {
  userId?: string;
}

const Header = ({ userId }: HeaderProps = { userId: undefined }) => {
  const { profile: profileData, isLoading: isLoadingProfileData } = useProfile({
    userId,
  });

  // Skeleton UI while loading Profile Data
  if (isLoadingProfileData) {
    return (
      <YStack
        padding="$4"
        paddingBottom={0}
        alignItems="center"
        backgroundColor="$background"
        gap="$4"
      >
        <View alignItems="center" marginBottom={-30}>
          <Skeleton circular size={160} />
        </View>

        <XStack
          justifyContent="space-between"
          alignItems="flex-end"
          width="100%"
        >
          <YStack alignItems="flex-start" gap="$2" flex={1}>
            <Skeleton width={80} height={20} />
            <Skeleton width={150} height={20} />
          </YStack>

          <YStack alignItems="flex-end" gap="$2">
            <Skeleton width={80} height={20} />
            <Skeleton width={150} height={20} />
          </YStack>
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack
      padding="$4"
      paddingBottom={0}
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <View alignItems="center" marginBottom={-30}>
        <Avatar source={profileData?.profilePictureUrl} size={160} />
      </View>

      <XStack justifyContent="space-between" alignItems="flex-end" width="100%">
        <YStack alignItems="flex-start" gap="$2" flex={1}>
          <SizableText
            size="$8"
            fontWeight="bold"
            textAlign="left"
            lineHeight={0}
          >
            {profileData?.name}
          </SizableText>

          {profileData?.bio && (
            <Paragraph
              theme="alt1"
              maxWidth="90%"
              textAlign="left"
              lineHeight={0}
            >
              {profileData?.bio}
            </Paragraph>
          )}
        </YStack>
        <Stats
          userId={userId}
          followingCount={profileData?.followingCount ?? 0}
          followerCount={profileData?.followerCount ?? 0}
        />
      </XStack>

      {/* {userId && profileData?.userId === userId ? (
        <ActionButton userId={userId} />
      ) : (
        <SelfActionButton />
      )} */}
      <ActionButton userId={userId} />
    </YStack>
  );
};

export default Header;
