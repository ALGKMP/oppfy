import React from "react";
import { TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Edit3, Send, Settings2, Share2 } from "@tamagui/lucide-icons";
import { getToken, Text, View, XStack, YStack } from "tamagui";

import Avatar from "~/components/Avatar";
import ActionButton from "~/components/Profile/ActionButton";
import Stats from "~/components/Profile/Stats";
import { Button } from "~/components/ui";
import { Skeleton } from "~/components/ui/Skeleton";
import useProfile from "~/hooks/useProfile";

interface HeaderProps {
  userId?: string;
}

const Header = ({ userId }: HeaderProps = { userId: undefined }) => {
  const router = useRouter();
  const { profile: profileData, isLoading: isLoadingProfileData } = useProfile({
    userId,
  });

  // Loading states
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const defaultProfile = {
    name: "Loading...",
    username: "loading",
    bio: null,
    profilePictureUrl: null,
    followingCount: 0,
    followerCount: 0,
    friendCount: 0,
    postCount: 0,
  };

  const profile = profileData ?? defaultProfile;

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack height={140} overflow="hidden" borderRadius="$6">
        {profile.profilePictureUrl ? (
          <>
            <Image
              source={profile.profilePictureUrl}
              style={{
                width: "100%",
                height: "100%",
                opacity: isImageLoaded ? 0.6 : 0,
              }}
              contentFit="cover"
              onLoadEnd={() => setIsImageLoaded(true)}
              transition={150}
            />
            <BlurView
              intensity={90}
              tint="light"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            />
          </>
        ) : (
          <View
            backgroundColor="$gray3"
            opacity={0.6}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        )}
      </YStack>

      {/* Profile Info Section */}
      <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-end">
          {/* Avatar and Name */}
          <YStack>
            <Avatar source={profile.profilePictureUrl} size={110} bordered />
            <YStack paddingTop="$3" gap="$1">
              {isLoadingProfileData ? (
                <>
                  <Skeleton width={150} height={28} />
                  <Skeleton width={100} height={16} />
                </>
              ) : (
                <>
                  <Text
                    height={28}
                    fontWeight="700"
                    fontSize="$7"
                    color="$color"
                  >
                    {profile.name}
                  </Text>
                  <Text height={16} fontSize="$3" color="$color" opacity={0.6}>
                    @{profile.username}
                  </Text>
                </>
              )}
            </YStack>
          </YStack>

          {/* Quick Action Buttons */}
          {!userId ? (
            <XStack gap="$3" paddingBottom="$1">
              <Button
                icon={<Settings2 size={20} />}
                variant="outlined"
                size="$3.5"
                circular
                borderWidth={1.5}
                onPress={() => router.push("/(app)/(settings)")}
                disabled={isLoadingProfileData}
                opacity={isLoadingProfileData ? 0.5 : 1}
              />
            </XStack>
          ) : (
            <XStack gap="$3" paddingBottom="$1">
              <Button
                icon={<Send size={20} />}
                variant="outlined"
                size="$3.5"
                circular
                borderWidth={1.5}
                disabled={isLoadingProfileData}
                opacity={isLoadingProfileData ? 0.5 : 1}
              />
            </XStack>
          )}
        </XStack>

        {/* Bio */}
        {profile.bio && (
          <Text
            fontSize="$4"
            color="$color"
            opacity={isLoadingProfileData ? 0.5 : 0.8}
            lineHeight={22}
          >
            {profile.bio}
          </Text>
        )}

        {/* Action Buttons */}
        <ActionButton userId={userId} />

        {/* Stats */}
        <Stats
          userId={userId}
          username={profile.username}
          postCount={profile.postCount}
          followingCount={profile.followingCount}
          followerCount={profile.followerCount}
          friendCount={profile.friendCount}
          isLoading={isLoadingProfileData}
        />
      </YStack>
    </YStack>
  );
};

export default Header;
