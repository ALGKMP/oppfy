import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useNavigation, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { debounce, throttle } from "lodash";
import { Skeleton } from "moti/skeleton";
import {
  Avatar,
  Button,
  getToken,
  Paragraph,
  ScrollView,
  SizableText,
  Spacer,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

import { abbreviatedNumber } from "@oppfy/utils";

import { api, RouterOutputs } from "~/utils/api";
import MediaOfYou from "./media-of-you";

type ProfileData = RouterOutputs["profile"]["getFullProfileSelf"];
type FriendItems = RouterOutputs["friend"]["paginateFriendsSelf"]["items"];

const ProfileLayout = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: profileData,
    isLoading,
    refetch,
  } = api.profile.getFullProfileSelf.useQuery();

  const {
    data: friendData,
    isLoading: isLoadingFriends,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchFriends,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const friendItems = useMemo(
    () => friendData?.pages.flatMap((page) => page.items) ?? [],
    [friendData],
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: profileData?.username,
    });
  }, [navigation, profileData?.username]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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

  return (
    <Animated.ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {isLoading || profileData === undefined ? (
        <YStack gap="$5">
          <Profile loading />
          <Friends loading />
        </YStack>
      ) : (
        <>
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

          <Spacer size="$5" />

          <MediaOfYou />
        </>
      )}
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

  return (
    <YStack
      padding="$4"
      paddingBottom={0}
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
    >
      <View marginBottom={-28}>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          disabled={props.loading}
        >
          <Avatar circular size="$14" bordered>
            <Avatar.Image
              {...(props.loading ? {} : { src: props.data.profilePictureUrl })}
            />
            <Avatar.Fallback />
          </Avatar>
        </TouchableOpacity>
      </View>

      <XStack justifyContent="space-between" alignItems="center" width="100%">
        <YStack alignItems="flex-start" gap="$2">
          {props.loading ? (
            <Skeleton width={100} height={25}>
              <SizableText size="$4" textAlign="left" />
            </Skeleton>
          ) : (
            <SizableText
              size="$5"
              fontWeight="bold"
              textAlign="left"
              lineHeight={0}
            >
              {props.data.name}
            </SizableText>
          )}

          {props.loading ? (
            <Skeleton width={250} height={50}>
              <Paragraph theme="alt1" textAlign="left" />
            </Skeleton>
          ) : props.data.bio ? (
            <Paragraph theme="alt1" textAlign="left" lineHeight={0}>
              {props.data.bio}
            </Paragraph>
          ) : null}
        </YStack>

        <YStack alignItems="flex-end" gap="$2">
          <TouchableOpacity
            disabled={props.loading}
            onPress={() => router.push("/self-connections/following-list")}
          >
            <Stat
              label="Following"
              value={
                props.loading
                  ? "0"
                  : abbreviatedNumber(props.data.followingCount)
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={props.loading}
            onPress={() => router.push("/self-connections/follower-list")}
          >
            <Stat
              label="Followers"
              value={
                props.loading
                  ? "0"
                  : abbreviatedNumber(props.data.followerCount)
              }
            />
          </TouchableOpacity>
        </YStack>
      </XStack>

      <XStack gap="$4">
        <Button
          size="$3.5"
          flex={1}
          disabled={props.loading}
          onPress={() => router.push("/edit-profile")}
        >
          Edit Profile
        </Button>
        <Button
          size="$3.5"
          flex={1}
          disabled={props.loading}
          onPress={() => router.push("/share-profile")}
        >
          Share Profile
        </Button>
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

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!showMore) return;

      const { contentSize, contentOffset, layoutMeasurement } =
        event.nativeEvent;

      if (contentSize && contentOffset && layoutMeasurement) {
        const contentWidth = contentSize.width;
        const offsetX = contentOffset.x;
        const layoutWidth = layoutMeasurement.width;

        // Check if within the threshold from the end
        if (offsetX + layoutWidth - 80 >= contentWidth) {
          throttledHandleAction();
        }
      }
    },
    [],
  );

  const handleAction = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/self-connections/friend-list");
  };

  const throttledHandleAction = useRef(
    throttle(handleAction, 300, { leading: true, trailing: false }),
  ).current;

  useEffect(() => {
    return () => {
      // Cleanup throttled fn
      throttledHandleAction.cancel();
    };
  }, []);

  if (props.loading) {
    return (
      <View
        width="100%"
        paddingVertical="$3"
        borderRadius="$6"
        backgroundColor="$gray2"
      >
        <YStack gap="$2">
          <XStack paddingLeft="$3" gap="$1">
            <Text fontWeight="700">0</Text>
            <Text fontWeight="600">Friends</Text>
          </XStack>

          <FlashList
            contentContainerStyle={{
              paddingHorizontal: 12,
            }}
            data={Array.from({ length: 10 })}
            horizontal
            showsHorizontalScrollIndicator={false}
            ItemSeparatorComponent={() => <Spacer size="$2" />}
            estimatedItemSize={70}
            renderItem={() => <Skeleton width={60} height={60} radius={30} />}
          />
        </YStack>
      </View>
    );
  }

  if (props.data.friendCount === 0) {
    return (
      <View
        width="100%"
        paddingVertical="$3"
        borderRadius="$6"
        backgroundColor="$gray2"
      >
        <YStack gap="$2" paddingHorizontal="$3">
          <Text fontWeight="600">Find Friends</Text>
          <Button size="$3.5" onPress={() => {}}>
            @oxy add recommendations here
          </Button>
        </YStack>
      </View>
    );
  }

  return (
    <View
      width="100%"
      paddingVertical="$3"
      borderRadius="$6"
      backgroundColor="$gray2"
    >
      <YStack gap="$2">
        <XStack paddingLeft="$3" gap="$1">
          <Text fontWeight="700">
            {abbreviatedNumber(props.loading ? 0 : props.data.friendCount)}
          </Text>
          <Text fontWeight="600">Friends</Text>
        </XStack>

        <FlashList
          contentContainerStyle={{
            paddingHorizontal: getToken("$space.3"),
          }}
          data={props.data.friendItems}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <Spacer size="$2" />}
          onScroll={handleScroll}
          estimatedItemSize={70}
          renderItem={({ item }) =>
            props.loading ? (
              <Skeleton width={60} height={60} radius={30} />
            ) : (
              <YStack gap="$1.5">
                <Avatar circular size="$6" bordered>
                  <Avatar.Image src={item.profilePictureUrl} />
                </Avatar>
                <Text fontWeight="600" textAlign="center">
                  {item.username}
                </Text>
              </YStack>
            )
          }
          ListFooterComponent={
            showMore ? (
              <View
                style={{
                  marginRight: -100,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#007AFF" }}>
                  See More
                </Text>
              </View>
            ) : null
          }
          ListFooterComponentStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      </YStack>
    </View>
  );
};

interface StatProps {
  label: string;
  value: string | number;
}

const Stat = (props: StatProps) => (
  <XStack gap="$1">
    <Text theme="alt1">{props.label}</Text>
    <Text fontWeight="bold" theme="alt1">
      {props.value}
    </Text>
  </XStack>
);

export default ProfileLayout;
