import React, { useState } from "react";
import { Modal, TouchableOpacity } from "react-native";
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
import StatusRenderer from "~/components/StatusRenderer";

export interface ProfileData {
  userId: string;
  username: string;
  name: string;
  bio: string | null;
  profilePictureUrl: string | null;
  followingCount: number;
  followerCount: number;
}

interface ProfileAction {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

interface ProfileHeaderDetailsProps {
  loading: boolean;
  data?: ProfileData;
  onFollowingPress?: () => void;
  onFollowersPress?: () => void;
  actions?: ProfileAction[];
}

const ProfileHeaderDetails: React.FC<ProfileHeaderDetailsProps> = ({
  loading,
  data,
  onFollowingPress,
  onFollowersPress,
  actions = [],
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleProfilePicturePress = () => {
    setIsModalVisible(true);
  };

  return (
    <YStack
      padding="$4"
      paddingBottom={0}
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <View alignItems="center" marginBottom={-30}>
        <StatusRenderer
          data={!loading ? data : undefined}
          loadingComponent={<Skeleton circular size={160} />}
          successComponent={(profileData) => (
            <TouchableOpacity onPress={handleProfilePicturePress}>
              <Image
                source={profileData.profilePictureUrl ?? DefaultProfilePicture}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                }}
              />
            </TouchableOpacity>
          )}
        />
      </View>

      <XStack justifyContent="space-between" alignItems="flex-end" width="100%">
        <YStack alignItems="flex-start" gap="$2" flex={1}>
          <StatusRenderer
            data={!loading ? data?.name : undefined}
            loadingComponent={<Skeleton width={80} height={20} />}
            successComponent={(name) => (
              <SizableText
                size="$8"
                fontWeight="bold"
                textAlign="left"
                lineHeight={0}
              >
                {name}
              </SizableText>
            )}
          />

          <StatusRenderer
            data={!loading ? data?.bio ?? "" : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(bio) =>
              bio.length ? (
                <Paragraph
                  theme="alt1"
                  maxWidth="90%"
                  textAlign="left"
                  lineHeight={0}
                >
                  {bio}
                </Paragraph>
              ) : null
            }
          />
        </YStack>

        <YStack alignItems="flex-end" gap="$2">
          <StatusRenderer
            data={!loading ? data?.followingCount : undefined}
            loadingComponent={<Skeleton width={80} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity onPress={onFollowingPress}>
                <Stat label="Following" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />
          <StatusRenderer
            data={!loading ? data?.followerCount : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity onPress={onFollowersPress}>
                <Stat label="Followers" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />
        </YStack>
      </XStack>

      <XStack gap="$4">
        {actions.map((action, index) => (
          <StatusRenderer
            key={index}
            data={!loading ? data?.username : undefined}
            loadingComponent={
              <View flex={1}>
                <Skeleton width="100%" height={44} radius={20} />
              </View>
            }
            successComponent={() => (
              <Button
                flex={1}
                borderRadius={20}
                onPress={action.onPress}
                disabled={action.disabled}
                icon={action.icon}
              >
                <XStack gap="$2" alignItems="center">
                  <Text>{action.label}</Text>
                  {action.loading && <Spinner size="small" color="$color" />}
                </XStack>
              </Button>
            )}
          />
        ))}
      </XStack>

      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setIsModalVisible(false)}
        >
          <Image
            source={data?.profilePictureUrl ?? DefaultProfilePicture}
            style={{
              width: "100%",
              height: "100%",
              resizeMode: "contain",
            }}
          />
        </TouchableOpacity>
      </Modal>
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
