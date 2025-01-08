import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Edit3, Send, Settings2, Share2 } from "@tamagui/lucide-icons";
import { getToken, Spinner, Text, View, XStack, YStack } from "tamagui";

import Avatar from "~/components/Avatar";
import ActionButton from "~/components/Profile/ActionButton";
import { Button } from "~/components/ui";
import useProfile from "~/hooks/useProfile";

interface HeaderProps {
  userId?: string;
}

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <YStack alignItems="center" gap="$1.5">
    <Text fontWeight="700" fontSize="$6" color="$color">
      {value}
    </Text>
    <Text fontSize="$2" color="$color" opacity={0.6} fontWeight="500">
      {label}
    </Text>
  </YStack>
);

const Header = ({ userId }: HeaderProps = { userId: undefined }) => {
  const router = useRouter();
  const { profile: profileData, isLoading: isLoadingProfileData } = useProfile({
    userId,
  });

  if (isLoadingProfileData) {
    return (
      <YStack padding="$4" alignItems="center">
        <Spinner size="small" color="$primary" />
      </YStack>
    );
  }

  if (!profileData) return null;

  return (
    <YStack>
      {/* Cover Image Area */}
      <YStack height={140} overflow="hidden" borderRadius="$6">
        <Image
          source={profileData.profilePictureUrl ?? ""}
          style={{
            width: "100%",
            height: "100%",
            opacity: 0.6,
          }}
          contentFit="cover"
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
      </YStack>

      {/* Profile Info Section */}
      <YStack marginTop={-60} paddingHorizontal="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="flex-end">
          {/* Avatar and Name */}
          <YStack>
            <Avatar
              source={profileData.profilePictureUrl}
              size={110}
              bordered
            />
            <YStack paddingTop="$3" gap="$1">
              <Text fontWeight="700" fontSize="$7" color="$color">
                {profileData.name}
              </Text>
              <Text fontSize="$3" color="$color" opacity={0.6}>
                @{profileData.username}
              </Text>
            </YStack>
          </YStack>

          {/* Quick Action Buttons */}
          {!userId ? (
            <XStack gap="$3" paddingBottom="$1">
              <Button
                icon={<Edit3 size={20} />}
                variant="outlined"
                size="$3.5"
                circular
                borderWidth={1.5}
                onPress={() => router.push("/edit-profile")}
              />
              <Button
                icon={<Share2 size={20} />}
                variant="outlined"
                size="$3.5"
                circular
                borderWidth={1.5}
                onPress={() => router.push("/share-profile")}
              />
              <Button
                icon={<Settings2 size={20} />}
                variant="outlined"
                size="$3.5"
                circular
                borderWidth={1.5}
                onPress={() => router.push("/(app)/(settings)")}
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
              />
            </XStack>
          )}
        </XStack>

        {/* Bio */}
        {profileData.bio && (
          <Text fontSize="$4" color="$color" opacity={0.8} lineHeight={22}>
            {profileData.bio}
          </Text>
        )}

        {/* Action Buttons */}
        <ActionButton userId={userId} />

        {/* Stats */}
        <XStack
          paddingVertical="$4"
          marginHorizontal="$-2.5"
          justifyContent="space-around"
          backgroundColor="$background"
          borderRadius="$8"
          borderWidth={1}
          borderColor="$borderColor"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.05}
          shadowRadius={8}
          elevation={2}
        >
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: userId
                  ? "/profile/connections/posts"
                  : "/self-profile/connections/posts",
                ...(userId && { params: { userId } }),
              })
            }
          >
            <StatItem
              label="Posts"
              value={profileData.profileStats?.postCount ?? 0}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: userId
                  ? "/profile/connections/following"
                  : "/self-profile/connections/following",
                ...(userId && { params: { userId } }),
              })
            }
          >
            <StatItem label="Following" value={profileData.followingCount} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: userId
                  ? "/profile/connections/followers"
                  : "/self-profile/connections/followers",
                ...(userId && { params: { userId } }),
              })
            }
          >
            <StatItem label="Followers" value={profileData.followerCount} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: userId
                  ? "/profile/connections/friends"
                  : "/self-profile/connections/friends",
                ...(userId && { params: { userId } }),
              })
            }
          >
            <StatItem label="Friends" value={profileData.friendCount} />
          </TouchableOpacity>
        </XStack>
      </YStack>
    </YStack>
  );
};

export default Header;
