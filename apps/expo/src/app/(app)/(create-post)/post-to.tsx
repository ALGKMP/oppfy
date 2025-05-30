import React, { useEffect, useState } from "react";
import { Animated, Keyboard, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, Phone, UserRoundX, Users } from "@tamagui/lucide-icons";
import type { IFuseOptions } from "fuse.js";
import type { CountryCode } from "libphonenumber-js";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { debounce } from "lodash";
import {
  Circle,
  getToken,
  Image,
  Stack,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

import {
  Avatar,
  EmptyPlaceholder,
  HeaderTitle,
  Icon,
  MediaListItem,
  SearchInput,
  SizableText,
  Spacer,
  useDialogController,
  View,
} from "~/components/ui";
import { Button } from "~/components/ui/Buttons";
import { useContacts } from "~/hooks/contacts";
import { useFlashListSize } from "~/hooks/useFlashListSize";
import useSearch from "~/hooks/useSearch";
import { api } from "~/utils/api";
import { storage } from "~/utils/storage";

interface Friend {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
  friend: {
    currentStreak: number;
  };
}

type ListItem =
  | { type: "header"; title: string; isContact?: boolean }
  | { type: "friend"; data: Friend }
  | { type: "contact"; data: Contact };

const HAS_SEEN_SHARE_TIP_KEY = "has_seen_share_tip";

// Creative card variants for different list items
const getItemVariant = (
  index: number,
  type: "friend" | "contact",
  hasStreak?: boolean,
) => {
  if (type === "friend" && hasStreak) {
    return "streak";
  }

  return "standard";
};

const CreativeListItem = ({
  item,
  index,
  onPress,
}: {
  item: ListItem;
  index: number;
  onPress: () => void;
}) => {
  const theme = useTheme();

  // Animation for streak cards (must be at top level)
  const [pulseAnim] = useState(new Animated.Value(1));
  const [gradientAnim] = useState(new Animated.Value(0));

  const isStreakFriend =
    item.type === "friend" && item.data.friend.currentStreak > 0;
  const variant =
    item.type === "friend"
      ? getItemVariant(index, "friend", isStreakFriend)
      : "standard";
  const isStreak = variant === "streak";

  const formatPhoneNumber = (
    phoneNumber: string | undefined,
    countryCode: string | undefined,
  ) => {
    if (phoneNumber === undefined || countryCode === undefined) return;
    try {
      const parsedNumber = parsePhoneNumberWithError(
        phoneNumber,
        countryCode.toUpperCase() as CountryCode,
      );
      return parsedNumber.isValid()
        ? parsedNumber.formatNational()
        : phoneNumber;
    } catch {
      return phoneNumber;
    }
  };

  useEffect(() => {
    if (isStreak) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();

      // Gradient animation
      const animateGradient = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(gradientAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: false,
            }),
            Animated.timing(gradientAnim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      };
      animateGradient();
    }
  }, [isStreak, pulseAnim, gradientAnim]);

  if (item.type === "header") {
    return (
      <XStack alignItems="center" paddingVertical="$2" gap="$2">
        <View borderRadius="$6" backgroundColor="$gray5" padding="$2.5">
          {item.isContact ? (
            <Icon name="call" disabled />
          ) : (
            <Icon name="people" disabled />
          )}
        </View>

        <YStack>
          <SizableText size="$5" fontWeight="bold" lineHeight={0}>
            {item.title}
          </SizableText>
          <SizableText size="$3" theme="alt1" lineHeight={0}>
            {item.isContact
              ? "Post for someone not on the app & invite them 📱"
              : "Post for friends already on Oppfy 🚀"}
          </SizableText>
        </YStack>
      </XStack>
    );
  }

  if (item.type === "friend") {
    if (isStreak) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Stack
            pressStyle={{ scale: 0.985, opacity: 0.9 }}
            animation="100ms"
            onPress={onPress}
            style={{ borderRadius: 24 }}
          >
            <LinearGradient
              padding="$4"
              borderRadius="$6"
              colors={["#FF0099", "#FF00FF", "#DD00DD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <XStack alignItems="center" gap="$2">
                <Avatar
                  size={56}
                  style={{
                    borderWidth: 3,
                    borderColor: "white",
                  }}
                  source={item.data.profilePictureUrl}
                />

                {/* User Info */}
                <YStack flex={1} gap="$1">
                  <SizableText
                    size="$5"
                    fontWeight="bold"
                    lineHeight={0}
                    color="white"
                  >
                    {item.data.name}
                  </SizableText>
                  <SizableText
                    size="$3"
                    lineHeight={0}
                    color="white"
                    opacity={0.95}
                  >
                    @{item.data.username}
                  </SizableText>
                </YStack>

                {/* Action Button and Streak */}
                <XStack alignItems="center" gap="$2">
                  {/* Streak indicator */}
                  <Button variant="white" size="$3" paddingLeft={10}>
                    <Text color="$primary" fontWeight="bold">
                      🔥
                      {item.data.friend.currentStreak}
                    </Text>
                  </Button>

                  {/* Action Button */}
                  <Button
                    variant="white"
                    size="$3"
                    iconAfter={<ChevronRight color="$primary" />}
                    onPress={onPress}
                  >
                    <Text color="$primary" fontWeight="bold">
                      Keep it up!
                    </Text>
                  </Button>
                </XStack>
              </XStack>
            </LinearGradient>
          </Stack>
        </Animated.View>
      );
    }

    // Standard friend card
    return (
      <Stack
        pressStyle={{ scale: 0.985, opacity: 0.9 }}
        animation="100ms"
        onPress={onPress}
        style={{ borderRadius: 24 }}
      >
        <LinearGradient
          padding="$3.5"
          borderRadius="$6"
          colors={["#6B7280", "#4B5563"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <XStack alignItems="center" gap="$2">
            <Avatar
              size={56}
              style={{ borderColor: "white", borderWidth: 2 }}
              source={item.data.profilePictureUrl}
            />

            {/* User Info */}
            <YStack flex={1} gap="$1">
              <SizableText
                size="$5"
                fontWeight="bold"
                lineHeight={0}
                color="white"
              >
                {item.data.name}
              </SizableText>
              <SizableText size="$3" lineHeight={0} color="white" opacity={0.9}>
                @{item.data.username}
              </SizableText>
            </YStack>

            {/* Action Button */}
            <Button
              variant="white"
              size="$3"
              iconAfter={<ChevronRight color="$gray3" />}
              onPress={onPress}
            >
              Select
            </Button>
          </XStack>
        </LinearGradient>
      </Stack>
    );
  }

  // Contact item
  return (
    <Stack
      pressStyle={{ scale: 0.985, opacity: 0.9 }}
      animation="100ms"
      onPress={onPress}
      style={{ borderRadius: 24 }}
    >
      <View padding="$3.5" borderRadius="$6" backgroundColor="$gray3">
        <XStack alignItems="center" gap="$2">
          <Avatar
            size={56}
            style={{ borderColor: "white", borderWidth: 2 }}
            source={item.data.imageAvailable ? item.data.image?.uri : undefined}
          />

          {/* Contact Info */}
          <YStack flex={1} gap="$1">
            <SizableText
              size="$5"
              fontWeight="bold"
              lineHeight={0}
              color="white"
            >
              {item.data.name}
            </SizableText>
            <SizableText size="$3" lineHeight={0} color="white" opacity={0.9}>
              {formatPhoneNumber(
                item.data.phoneNumbers?.[0]?.number,
                item.data.phoneNumbers?.[0]?.countryCode,
              ) ?? item.data.phoneNumbers?.[0]?.number}
            </SizableText>
          </YStack>

          {/* Action Button */}
          <Button
            variant="white"
            size="$3"
            iconAfter={<ChevronRight color="black" />}
            textProps={{
              color: "black",
            }}
            onPress={onPress}
          >
            Invite
          </Button>
        </XStack>
      </View>
    </Stack>
  );
};

const PostTo = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const infoDialog = useDialogController();

  // Use the reusable hook for FlashList size estimation
  const { estimatedListSize } = useFlashListSize({
    estimatedItemCount: 15,
    averageItemHeight: 85,
    headerHeight: 60,
    sectionHeaderHeight: 60,
    sectionHeaderCount: 2,
    extraBottomPadding: 50,
  });

  const { type, uri, height, width } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
    height: string;
    width: string;
  }>();

  const [refreshing, setRefreshing] = useState(false);
  const [searchedContacts, setSearchedContacts] = useState<Contact[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);

  const {
    contactsPaginatedQuery: {
      data: contactsData,
      isLoading: isLoadingContacts,
      isFetchingNextPage: isFetchingNextContacts,
      hasNextPage: hasNextContacts,
      fetchNextPage: fetchNextContacts,
      refetch: refetchContacts,
    },
    searchContacts,
    parsePhoneNumberEntry,
  } = useContacts();

  const contacts = contactsData?.pages.flatMap((page) => page.items) ?? [];

  const {
    data: friendsData,
    isLoading: isLoadingFriends,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.friend.paginateFriends.useInfiniteQuery(
    { pageSize: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const friendsList = friendsData?.pages.flatMap((page) => page.items) ?? [];

  const searchOptions: IFuseOptions<Friend> = {
    keys: ["username", "name"],
    threshold: 0.3,
  };

  console.log(friendsList);

  const {
    filteredItems: filteredFriends,
    searchQuery,
    setSearchQuery,
  } = useSearch({
    data: friendsList,
    fuseOptions: searchOptions,
  });

  const debouncedSearchContacts = debounce(async (text: string) => {
    const contacts = await searchContacts(text);
    setSearchedContacts(contacts);
  }, 100);

  useEffect(() => {
    return () => debouncedSearchContacts.cancel();
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    void debouncedSearchContacts(text);
  };

  const formatPhoneNumber = (
    phoneNumber: string | undefined,
    countryCode: string | undefined,
  ) => {
    if (phoneNumber === undefined || countryCode === undefined) return;
    try {
      const parsedNumber = parsePhoneNumberWithError(
        phoneNumber,
        countryCode.toUpperCase() as CountryCode,
      );
      return parsedNumber.isValid()
        ? parsedNumber.formatNational()
        : phoneNumber;
    } catch {
      return phoneNumber;
    }
  };

  const displayItems = () => {
    const result: ListItem[] = [];
    const friends = searchQuery ? filteredFriends : friendsList;
    const contactsToShow = searchQuery ? searchedContacts : contacts;

    // Wait for both data sources to be ready before displaying anything
    // This prevents the jumping effect where contacts appear first, then friends
    const bothDataReady = !isLoadingFriends && !isLoadingContacts;

    if (!bothDataReady) {
      return []; // Return empty array while loading
    }

    if (friends.length > 0) {
      result.push({ type: "header", title: "Your Friends" });
      friends.forEach((friend) => {
        result.push({ type: "friend", data: friend as Friend });
      });
    }

    if (contactsToShow.length > 0) {
      result.push({
        type: "header",
        title: "Your Contacts",
        isContact: true,
      });
      contactsToShow.forEach((contact) => {
        result.push({ type: "contact", data: contact });
      });
    }

    return result;
  };

  useEffect(() => {
    if (__DEV__) storage.set(HAS_SEEN_SHARE_TIP_KEY, true);
    const hasSeenTip = storage.getBoolean(HAS_SEEN_SHARE_TIP_KEY);

    if (!hasSeenTip) {
      const timer = setTimeout(() => {
        void infoDialog.show({
          title: "Pro Tip: Friendly Peer Pressure 😈",
          subtitle:
            "Your friends aren't on Oppfy yet? Even better! Post something for them anyway - they'll get a text invite to join and see your post when they do. Watch how fast they download the app! 🎯",
          acceptText: "Love it",
        });
        storage.set(HAS_SEEN_SHARE_TIP_KEY, true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchContacts(), refetch()]);
    setRefreshing(false);
  };

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage && !searchQuery) {
      await fetchNextPage();
    }
    if (!isFetchingNextContacts && hasNextContacts && !searchQuery) {
      await fetchNextContacts();
    }
  };

  const onContactSelected = (contact: Contact) => {
    const formattedPhoneNumber = parsePhoneNumberEntry(
      contact.phoneNumbers?.[0],
    );

    if (!formattedPhoneNumber) return;

    router.navigate({
      pathname: "/create-post",
      params: {
        uri,
        type,
        width,
        height,
        name: contact.name,
        number: formattedPhoneNumber,
        userType: "notOnApp",
        recipientName: contact.name,
        recipientImage: contact.imageAvailable ? contact.image?.uri : undefined,
      },
    });
  };

  const onFriendSelected = (friend: Friend) => {
    router.navigate({
      pathname: "/create-post",
      params: {
        uri,
        type,
        width,
        height,
        recipient: friend.userId,
        userType: "onApp",
        recipientName: friend.name,
        recipientUsername: friend.username,
        recipientImage: friend.profilePictureUrl ?? undefined,
      },
    });
  };

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === "header") {
      return (
        <CreativeListItem
          item={item}
          index={index}
          onPress={() => {
            if (item.isContact) {
              void infoDialog.show({
                title: "Post for Anyone",
                subtitle:
                  "You can share posts with friends who aren't on Oppfy yet! They'll get a text invite to join and see your post when they do. It's a great way to bring your friends into the fun.",
                acceptText: "Got it",
              });
            }
          }}
        />
      );
    }

    if (item.type === "friend") {
      return (
        <CreativeListItem
          item={item}
          index={index}
          onPress={() => onFriendSelected(item.data)}
        />
      );
    }

    return (
      <CreativeListItem
        item={item}
        index={index}
        onPress={() => onContactSelected(item.data)}
      />
    );
  };

  const ListHeaderComponent = (
    <YStack gap="$4">
      <SearchInput
        placeholder="Search..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => {
          debouncedSearchContacts.cancel();
          setSearchQuery("");
          setSearchedContacts([]);
        }}
      />
    </YStack>
  );

  const ListEmptyComponent = () => {
    // Always show loading skeletons when data isn't ready to prevent black flash
    const bothDataReady = !isLoadingFriends && !isLoadingContacts;

    if (!bothDataReady || isSearchingContacts) {
      return (
        <YStack gap="$2.5">
          {Array.from({ length: 12 }).map((_, index) => (
            <MediaListItem.Skeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (friendsList.length === 0 && contacts.length === 0) {
      return (
        <YStack flex={1} justifyContent="center">
          <EmptyPlaceholder
            title="Nowhere to post"
            subtitle="No friends yet, once you've added someone they'll show up here."
            icon={<UserRoundX />}
          />
        </YStack>
      );
    }

    if (searchQuery && displayItems().length === 0) {
      return (
        <YStack flex={1}>
          <HeaderTitle>No Results Found</HeaderTitle>
        </YStack>
      );
    }

    return null;
  };

  const getItemType = (item: ListItem) => {
    return item.type;
  };

  const keyExtractor = (item: ListItem) => {
    switch (item.type) {
      case "header":
        return `header-${item.title}`;
      case "friend":
        return `friend-${item.data.userId}`;
      case "contact":
        return `contact-${item.data.id ?? item.data.phoneNumbers?.[0]?.number}`;
    }
  };

  return (
    <FlashList
      data={displayItems()}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={85}
      estimatedListSize={estimatedListSize}
      removeClippedSubviews={false}
      overrideItemLayout={(layout, item) => {
        // Provide exact measurements to prevent layout shifts
        if (item.type === "header") {
          layout.size = 60;
        } else if (item.type === "friend") {
          const isStreakFriend = item.data.friend.currentStreak > 0;
          layout.size = isStreakFriend ? 103 : 88;
        } else if (item.type === "contact") {
          layout.size = 88;
        }
      }}
      getItemType={getItemType}
      ItemSeparatorComponent={Spacer}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponentStyle={{
        marginBottom: getToken("$3", "space") as number,
      }}
      contentContainerStyle={{
        padding: getToken("$4", "space") as number,
        paddingBottom: (insets.bottom + getToken("$2", "space")) as number,
      }}
      onEndReached={handleOnEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default PostTo;
