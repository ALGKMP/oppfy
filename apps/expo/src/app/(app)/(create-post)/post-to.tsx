import React, { useEffect, useState } from "react";
import { Animated, Keyboard, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Contact } from "expo-contacts";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronRight,
  Crown,
  Flame,
  Phone,
  Sparkles,
  Star,
  UserRoundX,
  Users,
} from "@tamagui/lucide-icons";
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

import {
  EmptyPlaceholder,
  HeaderTitle,
  Icon,
  MediaListItem,
  SearchInput,
  Spacer,
  useDialogController,
} from "~/components/ui";
import { Button } from "~/components/ui/Buttons";
import { useContacts } from "~/hooks/contacts";
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

  const isStreakFriend =
    item.type === "friend" && item.data.friend.currentStreak > 0;
  const variant =
    item.type === "friend"
      ? getItemVariant(index, "friend", isStreakFriend)
      : "standard";
  const isStreak = variant === "streak";

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
    }
  }, [isStreak, pulseAnim]);

  if (item.type === "header") {
    return (
      <XStack
        alignItems="center"
        gap="$2.5"
        paddingVertical="$3"
        paddingHorizontal="$2"
        marginTop="$2"
      >
        <XStack alignItems="center" gap="$2.5" flex={1}>
          {/* Enhanced icon with decorative elements */}
          <Stack position="relative">
            <Circle
              size={40}
              backgroundColor="rgba(255,255,255,0.95)"
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.25}
              shadowRadius={4}
              elevation={6}
            >
              {item.isContact ? (
                <Phone size={18} color="#3B82F6" />
              ) : (
                <Users size={18} color="#FF66FF" />
              )}
            </Circle>
          </Stack>

          {/* Enhanced title section */}
          <YStack flex={1} gap="$0.5">
            <Text
              color="white"
              fontSize={18}
              fontWeight="800"
              numberOfLines={1}
              shadowColor="rgba(0,0,0,0.4)"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={1}
              shadowRadius={2}
            >
              {item.title}
            </Text>
            <Text
              color="white"
              opacity={0.9}
              fontSize={11}
              fontWeight="600"
              shadowColor="rgba(0,0,0,0.2)"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={1}
              shadowRadius={1}
            >
              {item.isContact
                ? "Post for people not on the app ✨"
                : "Your Opps 🚀"}
            </Text>
          </YStack>
        </XStack>
      </XStack>
    );
  }

  if (item.type === "friend") {
    if (isStreak) {
      return (
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            marginBottom: 8,
          }}
        >
          <Stack
            borderRadius="$6"
            overflow="hidden"
            pressStyle={{ scale: 0.98 }}
            onPress={onPress}
            padding="$4"
            minHeight={95}
            borderWidth={2}
            borderColor="$red10"
          >
            <LinearGradient
              colors={["#F214FF", "#EE5A52", "#DC2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <XStack alignItems="center" gap="$3" flex={1}>
              {/* Profile Picture with decorative ring */}
              <Stack position="relative">
                <Circle
                  size={65}
                  backgroundColor="white"
                  padding={2}
                  shadowColor="$shadowColor"
                  shadowOffset={{ width: 0, height: 3 }}
                  shadowOpacity={0.3}
                  shadowRadius={6}
                  elevation={8}
                >
                  <Circle size={61} overflow="hidden" backgroundColor="$gray6">
                    <Image
                      source={
                        item.data.profilePictureUrl
                          ? { uri: item.data.profilePictureUrl }
                          : DefaultProfilePicture
                      }
                      width="100%"
                      height="100%"
                    />
                  </Circle>
                </Circle>
              </Stack>

              {/* User Info */}
              <YStack flex={1} gap="$1">
                <XStack alignItems="center" gap="$2">
                  <Text
                    color="white"
                    fontSize={17}
                    fontWeight="700"
                    numberOfLines={1}
                    shadowColor="rgba(0,0,0,0.3)"
                    shadowOffset={{ width: 0, height: 1 }}
                    shadowOpacity={1}
                    shadowRadius={2}
                  >
                    @{item.data.username}
                  </Text>
                  <XStack
                    alignItems="center"
                    gap="$1.5"
                    backgroundColor="rgba(255,215,0,0.95)"
                    paddingHorizontal="$2.5"
                    paddingVertical="$1.5"
                    borderRadius="$4"
                    shadowColor="$shadowColor"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={0.4}
                    shadowRadius={3}
                  >
                    <Text fontSize={16} color="white">
                      🔥
                    </Text>
                    <Text fontSize={13} color="white" fontWeight="800">
                      {item.data.friend.currentStreak}
                    </Text>
                  </XStack>
                </XStack>
                <XStack alignItems="center" gap="$1.5">
                  <Text
                    color="white"
                    opacity={0.95}
                    fontSize={15}
                    numberOfLines={1}
                    shadowColor="rgba(0,0,0,0.2)"
                    shadowOffset={{ width: 0, height: 1 }}
                    shadowOpacity={1}
                    shadowRadius={1}
                  >
                    {item.data.name}
                  </Text>
                </XStack>
              </YStack>

              {/* Action Button */}
              <Button
                variant="primary"
                size="$3"
                borderRadius="$4"
                backgroundColor="rgba(255,215,0,0.9)"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.3}
                shadowRadius={4}
                pressStyle={{
                  backgroundColor: "rgba(255,215,0,1)",
                  scale: 0.95,
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  onPress();
                }}
              >
                <XStack alignItems="center" gap="$1.5">
                  <Text color="white" fontSize={12} fontWeight="700">
                    Keep it up!
                  </Text>
                  <ChevronRight size={14} color="white" />
                </XStack>
              </Button>
            </XStack>
          </Stack>
        </Animated.View>
      );
    }

    // Standard friend card
    return (
      <Stack
        borderRadius="$6"
        overflow="hidden"
        marginBottom="$2"
        pressStyle={{ scale: 0.98 }}
        onPress={onPress}
        padding="$4"
        minHeight={80}
        borderWidth={1}
        borderColor="#E533E5"
      >
        <LinearGradient
          colors={["#FF66FF", "#E533E5", "#CC00CC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <XStack alignItems="center" gap="$3" flex={1}>
          {/* Profile Picture with decorative ring */}
          <Stack position="relative">
            <Circle
              size={55}
              backgroundColor="white"
              padding={2}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.2}
              shadowRadius={4}
              elevation={4}
            >
              <Circle size={51} overflow="hidden" backgroundColor="$gray6">
                <Image
                  source={
                    item.data.profilePictureUrl
                      ? { uri: item.data.profilePictureUrl }
                      : DefaultProfilePicture
                  }
                  width="100%"
                  height="100%"
                />
              </Circle>
            </Circle>
          </Stack>

          {/* User Info */}
          <YStack flex={1} gap="$1">
            <Text
              color="white"
              fontSize={16}
              fontWeight="700"
              numberOfLines={1}
              shadowColor="rgba(0,0,0,0.2)"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={1}
              shadowRadius={1}
            >
              @{item.data.username}
            </Text>
            <Text
              color="white"
              opacity={0.9}
              fontSize={14}
              numberOfLines={1}
              shadowColor="rgba(0,0,0,0.1)"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={1}
              shadowRadius={1}
            >
              {item.data.name}
            </Text>
          </YStack>

          {/* Action Button */}
          <Button
            variant="white"
            size="$3"
            borderRadius="$4"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.2}
            shadowRadius={3}
            onPress={(e) => {
              e.stopPropagation();
              onPress();
            }}
          >
            <XStack alignItems="center" gap="$1.5">
              <Text color="#FF66FF" fontSize={12} fontWeight="600">
                Select
              </Text>
              <ChevronRight size={14} color="#FF66FF" />
            </XStack>
          </Button>
        </XStack>
      </Stack>
    );
  }

  // Contact item
  return (
    <Stack
      borderRadius="$6"
      overflow="hidden"
      padding="$4"
      marginBottom="$2"
      borderWidth={1}
      borderColor="$blue8"
      pressStyle={{
        scale: 0.98,
      }}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#3B82F6", "#1E40AF", "#1E3A8A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <XStack alignItems="center" gap="$3">
        {/* Profile Picture */}
        <Stack position="relative">
          <Circle
            size={55}
            backgroundColor="white"
            padding={2}
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.2}
            shadowRadius={4}
            elevation={4}
          >
            <Circle size={51} overflow="hidden" backgroundColor="$gray6">
              <Image
                source={
                  item.data.imageAvailable
                    ? { uri: item.data.image?.uri }
                    : DefaultProfilePicture
                }
                width="100%"
                height="100%"
              />
            </Circle>
          </Circle>

          {/* Invite indicator */}
          <Circle
            size={18}
            position="absolute"
            bottom={-2}
            right={-2}
            backgroundColor="white"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={0.3}
            shadowRadius={2}
          >
            <Phone size={8} color="#3B82F6" />
          </Circle>
        </Stack>

        {/* Contact Info */}
        <YStack flex={1} gap="$1">
          <Text
            color="white"
            fontSize={16}
            fontWeight="700"
            numberOfLines={1}
            shadowColor="rgba(0,0,0,0.2)"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={1}
            shadowRadius={1}
          >
            {item.data.name}
          </Text>
          <Text
            color="white"
            opacity={0.9}
            fontSize={13}
            numberOfLines={1}
            shadowColor="rgba(0,0,0,0.1)"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={1}
            shadowRadius={1}
          >
            {item.data.phoneNumbers?.[0]?.number}
          </Text>
          <Text
            fontSize={11}
            color="white"
            opacity={0.95}
            fontWeight="500"
            shadowColor="rgba(0,0,0,0.1)"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={1}
            shadowRadius={1}
          >
            Will receive invite ✨
          </Text>
        </YStack>

        {/* Action Button */}
        <Button
          variant="white"
          size="$3"
          borderRadius="$4"
          shadowColor="$shadowColor"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.2}
          shadowRadius={3}
          onPress={(e) => {
            e.stopPropagation();
            onPress();
          }}
        >
          <XStack alignItems="center" gap="$1.5">
            <Text color="#3B82F6" fontSize={12} fontWeight="700">
              Invite
            </Text>
            <ChevronRight size={14} color="#3B82F6" />
          </XStack>
        </Button>
      </XStack>
    </Stack>
  );
};

const PostTo = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const infoDialog = useDialogController();

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

    if (friends.length > 0) {
      result.push({ type: "header", title: "Friends" });
      friends.forEach((friend) => {
        result.push({ type: "friend", data: friend as Friend });
      });
    }

    if (contactsToShow.length > 0) {
      result.push({
        type: "header",
        title: "Post for contacts",
        isContact: true,
      });
      contactsToShow.forEach((contact) => {
        result.push({ type: "contact", data: contact });
      });
    }

    return result;
  };

  useEffect(() => {
    if (__DEV__) storage.set(HAS_SEEN_SHARE_TIP_KEY, false);
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
    const isLoading =
      isLoadingFriends || isLoadingContacts || isSearchingContacts;

    if (isLoading) {
      return (
        <YStack gap="$2.5">
          {Array.from({ length: 20 }).map((_, index) => (
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
      estimatedItemSize={75}
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
