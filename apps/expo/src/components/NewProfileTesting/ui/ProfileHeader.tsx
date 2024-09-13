import React from "react";
import type { ColorValue } from "react-native";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import {
  Button,
  Paragraph,
  SizableText,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedNumber } from "@oppfy/utils";

import { Skeleton } from "~/components/Skeletons";

export interface ProfileData {
  userId: string;
  username: string;
  name: string;
  bio: string | null;
  profilePictureUrl: string | undefined | null;
  followingCount: number;
  followerCount: number;
}

export interface ProfileAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  backgroundColor?: ColorValue | undefined;
  loading?: boolean;
}

interface LoadingProps {
  loading: true;
}

interface LoadedProps {
  loading: false;
  data: ProfileData;
  onFollowingPress?: () => void;
  onFollowersPress?: () => void;
  actions?: ProfileAction[];
}

type ProfileHeaderDetailsProps = LoadingProps | LoadedProps;

const ProfileHeaderDetails = (props: ProfileHeaderDetailsProps) => {
  if (props.loading) {
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

        <XStack gap="$4">
          <View flex={1}>
            <Skeleton width="100%" height={44} radius={20} />
          </View>
          <View flex={1}>
            <Skeleton width="100%" height={44} radius={20} />
          </View>
        </XStack>
      </YStack>
    );
  }

  const { data, onFollowingPress, onFollowersPress, actions = [] } = props;

  return (
    <YStack
      padding="$4"
      paddingBottom={0}
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <View alignItems="center" marginBottom={-30}>
        <Image
          source={data.profilePictureUrl ?? DefaultProfilePicture}
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
          }}
        />
      </View>

      <XStack justifyContent="space-between" alignItems="flex-end" width="100%">
        <YStack alignItems="flex-start" gap="$2" flex={1}>
          <SizableText
            size="$8"
            fontWeight="bold"
            textAlign="left"
            lineHeight={0}
          >
            {data.name}
          </SizableText>

          {data.bio && (
            <Paragraph
              theme="alt1"
              maxWidth="90%"
              textAlign="left"
              lineHeight={0}
            >
              {data.bio}
            </Paragraph>
          )}
        </YStack>

        <YStack alignItems="flex-end" gap="$2">
          {onFollowingPress ? (
            <TouchableOpacity onPress={onFollowingPress}>
              <Stat
                label="Following"
                value={abbreviatedNumber(data.followingCount)}
              />
            </TouchableOpacity>
          ) : (
            <Stat
              label="Following"
              value={abbreviatedNumber(data.followingCount)}
            />
          )}
          {onFollowersPress ? (
            <TouchableOpacity onPress={onFollowersPress}>
              <Stat
                label="Followers"
                value={abbreviatedNumber(data.followerCount)}
              />
            </TouchableOpacity>
          ) : (
            <Stat
              label="Followers"
              value={abbreviatedNumber(data.followerCount)}
            />
          )}
        </YStack>
      </XStack>

      <XStack gap="$4">
        {actions.map((action, index) => (
          <Button
            key={index}
            flex={1}
            borderRadius={20}
            backgroundColor={action.backgroundColor}
            onPress={action.onPress}
            disabled={action.disabled}
          >
            <XStack gap="$2" alignItems="center">
              <Text>{action.label}</Text>
              {action.loading && <Spinner size="small" color="$color" />}
            </XStack>
          </Button>
        ))}
      </XStack>
    </YStack>
  );
};

interface StatProps {
  label: string;
  value: string | number;
}

const Stat = (props: StatProps) => (
  <XStack gap="$1">
    <Text theme="alt1" lineHeight={0}>
      {props.label}{" "}
    </Text>
    <Text fontWeight="bold" lineHeight={0}>
      {props.value}
    </Text>
  </XStack>
);

export default ProfileHeaderDetails;
