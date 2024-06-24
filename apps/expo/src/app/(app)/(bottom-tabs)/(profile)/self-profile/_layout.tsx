import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { RefreshControl, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { throttle } from "lodash";
import {
  Avatar,
  Button,
  getToken,
  ListItemTitle,
  Paragraph,
  SizableText,
  Spacer,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedNumber } from "@oppfy/utils";

import CardContainer from "~/components/Containers/CardContainer";
import { Skeleton } from "~/components/Skeletons";
import StatusRenderer from "~/components/StatusRenderer";
import { useUploadProfilePicture } from "~/hooks/media";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";
import MediaOfYou from "./media-of-you";

type ProfileData = RouterOutputs["profile"]["getFullProfileSelf"];
type FriendItems = RouterOutputs["friend"]["paginateFriendsSelf"]["items"];

const ProfileLayout = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: profileData,
    isLoading: isLoadingProfileData,
    refetch: refetchProfileData,
  } = api.profile.getFullProfileSelf.useQuery();

  const {
    data: friendsData,
    isLoading: isLoadingFriendsData,
    refetch: refetchFriendsData,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfileData(), refetchFriendsData()]);
    setRefreshing(false);
  }, [refetchFriendsData, refetchProfileData]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const profileAnimatedStyle = useAnimatedStyle(() => {
    const minimalOpacity = Math.max(1 - scrollY.value / 400, 0);
    return {
      opacity: minimalOpacity,
    };
  });

  if (
    isLoadingProfileData ||
    isLoadingFriendsData ||
    profileData === undefined ||
    friendsData === undefined
  ) {
    return (
      <YStack gap="$5">
        <Profile loading />
        <Friends loading />
      </YStack>
    );
  }

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <YStack gap="$5">
        <Animated.View style={profileAnimatedStyle}>
          <YStack gap="$5">
            <Profile loading={false} data={profileData} />
            <Friends
              loading={false}
              data={{
                friendCount: profileData.friendCount,
                friendItems: friendItems,
              }}
            />
          </YStack>
        </Animated.View>

        <MediaOfYou />
      </YStack>
    </Animated.ScrollView>
  );
};

interface LoadingProps {
  loading: true;
}

interface ProfileLoadedProps {
  loading: false;
  data: ProfileData;
}

type ProfileProps = LoadingProps | ProfileLoadedProps;

const Profile = (props: ProfileProps) => {
  const router = useRouter();

  const { pickAndUploadImage } = useUploadProfilePicture({
    optimisticallyUpdate: true,
  });

  const onFollowingListPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/following-list");
  };

  const onFollowerListPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/follower-list");
  };

  const onEditProfilePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/edit-profile");
  };

  const onShareProfilePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: add sharing functionality with deep linking
  };

  return (
    <YStack
      padding="$4"
      paddingBottom={0}
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <View marginBottom={-28} alignItems="center">
        <StatusRenderer
          data={!props.loading ? props.data.profilePictureUrl : undefined}
          loadingComponent={<Skeleton circular size={140} />}
          successComponent={(url) => (
            <TouchableOpacity onPress={pickAndUploadImage}>
              <Avatar circular size={140} bordered>
                <Avatar.Image src={url} />
                <Avatar.Fallback />
              </Avatar>
            </TouchableOpacity>
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
                size="$5"
                fontWeight="bold"
                textAlign="left"
                lineHeight={0}
              >
                {name}
              </SizableText>
            )}
          />

          <StatusRenderer
            data={!props.loading ? props.data.bio : undefined}
            loadingComponent={<Skeleton width={150} height={20} />}
            successComponent={(bio) => (
              <Paragraph theme="alt1" textAlign="left" lineHeight={0}>
                {bio}
              </Paragraph>
            )}
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

interface FriendsData {
  friendCount: number;
  friendItems: FriendItems;
}

interface FriendsLoadedProps {
  loading: false;
  data: FriendsData;
}

type FriendsProps = LoadingProps | FriendsLoadedProps;

const Friends = (props: FriendsProps) => {
  const router = useRouter();

  const showMore =
    !props.loading && props.data.friendItems.length < props.data.friendCount;

  const handleFriendClicked = (profileId: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate({
      pathname: "/(profile)/profile/[profile-id]/",
      params: { profileId: String(profileId) },
    });
  };

  const handleShowMoreFriends = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/friend-list");
  };

  const throttledHandleAction = useRef(
    throttle(handleShowMoreFriends, 300, { leading: true, trailing: false }),
  ).current;

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!showMore) return;

      const { contentSize, contentOffset, layoutMeasurement } =
        event.nativeEvent;

      const contentWidth = contentSize.width;
      const offsetX = contentOffset.x;
      const layoutWidth = layoutMeasurement.width;

      // Check if within the threshold from the end
      if (offsetX + layoutWidth - 80 >= contentWidth) {
        throttledHandleAction();
      }
    },
    [showMore, throttledHandleAction],
  );

  useEffect(() => throttledHandleAction.cancel(), [throttledHandleAction]);

  const renderLoadingSkeletons = () => (
    <CardContainer>
      <XStack gap="$2">
        {PLACEHOLDER_DATA.map((item, index) => (
          <Skeleton key={index} circular size={70} />
        ))}
      </XStack>
    </CardContainer>
  );

  const renderSuggestions = () => (
    <CardContainer>
      <YStack gap="$2">
        <Text fontWeight="600">Find Friends</Text>
        <Button size="$3.5">@oxy add recommendations here</Button>
      </YStack>
    </CardContainer>
  );

  const renderFriendList = (data: FriendsData) => (
    <CardContainer paddingHorizontal={0}>
      <YStack gap="$2">
        <TouchableOpacity onPress={handleShowMoreFriends}>
          <ListItemTitle paddingLeft="$3">
            Friends ({abbreviatedNumber(data.friendCount)})
          </ListItemTitle>
        </TouchableOpacity>

        <FlashList
          data={data.friendItems}
          horizontal
          estimatedItemSize={70}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleFriendClicked(item.profileId)}
            >
              <YStack gap="$1.5">
                <Avatar circular size="$6" bordered>
                  <Avatar.Image src={item.profilePictureUrl} />
                </Avatar>
                <Text fontWeight="600" textAlign="center">
                  {item.username}
                </Text>
              </YStack>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            showMore ? (
              <View
                marginRight={-100}
                justifyContent="center"
                alignItems="center"
              >
                <SizableText color="$blue7" fontWeight="600">
                  See more
                </SizableText>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <Spacer size="$2" />}
          contentContainerStyle={{
            paddingHorizontal: getToken("$3", "space") as number,
          }}
          ListFooterComponentStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </YStack>
    </CardContainer>
  );

  if (props.loading) {
    return renderLoadingSkeletons();
  }

  if (props.data.friendCount === 0) {
    return renderSuggestions();
  }

  return renderFriendList(props.data);
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
    <Text fontWeight="bold" theme="alt1" lineHeight={0}>
      {props.value}
    </Text>
  </XStack>
);

export default ProfileLayout;
