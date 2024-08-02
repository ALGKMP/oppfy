import { TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import {
  Avatar,
  Button,
  Paragraph,
  SizableText,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedNumber } from "@oppfy/utils";

import { Skeleton } from "~/components/Skeletons";
import StatusRenderer from "~/components/StatusRenderer";
import { useSession } from "~/contexts/SessionContext";
import { useUploadProfilePicture } from "~/hooks/media";
import type { RouterOutputs } from "~/utils/api";

type ProfileData = RouterOutputs["profile"]["getFullProfileSelf"];

interface LoadingProps {
  loading: true;
}

interface ProfileLoadedProps {
  loading: false;
  data: ProfileData;
}
type ProfileProps = LoadingProps | ProfileLoadedProps;

const ProfileHeaderDetailsSelf = (props: ProfileProps) => {
  const router = useRouter();
  const { user } = useSession();

  const { pickAndUploadImage } = useUploadProfilePicture({
    optimisticallyUpdate: true,
  });

  const onFollowingListPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/following-list");
  };

  const onFollowerListPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/followers-list");
  };

  const onEditProfilePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/edit-profile");
  };

  const onShareProfilePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/share-profile");
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
          data={!props.loading ? props.data : undefined}
          loadingComponent={<Skeleton circular size={160} />}
          successComponent={(profileData) => (
            <>
              {user?.uid === profileData.userId ? (
                <TouchableOpacity onPress={pickAndUploadImage}>
                  <Image
                    source={
                      profileData.profilePictureUrl ?? DefaultProfilePicture
                    }
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: 80,
                      borderColor: "#F214FF",
                      borderWidth: 2,
                    }}
                  />
                </TouchableOpacity>
              ) : (
                <Image
                  source={
                    profileData.profilePictureUrl ?? DefaultProfilePicture
                  }
                  style={{ width: 160, height: 160, borderRadius: 80 }}
                />
              )}
            </>
          )}
        />
      </View>

      <XStack justifyContent="space-between" alignItems="center" width="100%">
        <YStack alignItems="flex-start" gap="$2">
          <StatusRenderer
            data={!props.loading ? props.data.name : undefined}
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
            data={!props.loading ? props.data.bio ?? "" : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(bio) =>
              bio.length ? (
                <Paragraph theme="alt1" textAlign="left" lineHeight={0}>
                  {bio}
                </Paragraph>
              ) : null
            }
          />
        </YStack>

        <YStack alignItems="flex-end" gap="$2">
          <StatusRenderer
            data={!props.loading ? props.data.followingCount : undefined}
            loadingComponent={<Skeleton width={80} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity onPress={onFollowingListPress}>
                <Stat label="Following" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />
          <StatusRenderer
            data={!props.loading ? props.data.followerCount : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(count) => (
              <TouchableOpacity onPress={onFollowerListPress}>
                <Stat label="Followers" value={abbreviatedNumber(count)} />
              </TouchableOpacity>
            )}
          />
        </YStack>
      </XStack>

      <XStack gap="$4">
        <StatusRenderer
          data={!props.loading ? props.data.username : undefined}
          loadingComponent={
            <View flex={1}>
              <Skeleton width="100%" height={44} radius={20} />
            </View>
          }
          successComponent={() => (
            <Button flex={1} borderRadius={20} onPress={onEditProfilePress}>
              Edit Profile
            </Button>
          )}
        />
        <StatusRenderer
          data={!props.loading ? props.data.username : undefined}
          loadingComponent={
            <View flex={1}>
              <Skeleton width="100%" height={44} radius={20} />
            </View>
          }
          successComponent={() => (
            <Button flex={1} borderRadius={20} onPress={onShareProfilePress}>
              Share Profile
            </Button>
          )}
        />
      </XStack>
    </YStack>
  );
};

interface StatProps {
  label: string;
  value: string | number;
}

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

export default ProfileHeaderDetailsSelf;
