import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, Info, UserRoundX } from "@tamagui/lucide-icons";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { getToken } from "tamagui";

import {
  H5,
  H6,
  MediaListItem,
  MediaListItemSkeleton,
  SearchInput,
  Spacer,
  useDialogController,
  XStack,
  YStack,
} from "~/components/ui";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { useContacts } from "~/hooks/contacts";
import useSearch from "~/hooks/useSearch";
import { api } from "~/utils/api";
import { storage } from "~/utils/storage";

const INITIAL_PAGE_SIZE = 5;
const ADDITIONAL_PAGE_SIZE = 10;

type Friend = {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
};

type ListItem =
  | { type: "header"; title: string; isContact?: boolean }
  | { type: "friend"; data: Friend }
  | { type: "contact"; data: Contact };

const HAS_SEEN_SHARE_TIP_KEY = "has_seen_share_tip";

const PostTo = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const infoDialog = useDialogController();

  const { type, uri, height, width } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
    height: string;
    width: string;
  }>();

  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [visibleContacts, setVisibleContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [contactsPage, setContactsPage] = useState(0);
  const { getDeviceContactsNotOnApp } = useContacts();

  const {
    data: friendsData,
    isLoading: isLoadingFriends,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    { pageSize: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  const formatPhoneNumber = useCallback((phoneNumber: string | undefined) => {
    if (phoneNumber === undefined) return;
    try {
      const parsedNumber = parsePhoneNumberWithError(phoneNumber);
      return parsedNumber.isValid()
        ? parsedNumber.formatNational()
        : phoneNumber;
    } catch (error) {
      return phoneNumber;
    }
  }, []);

  const friendsList = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );

  const items = useMemo(() => {
    const result: ListItem[] = [];

    // Add friends section if there are friends
    if (friendsList.length > 0) {
      result.push({ type: "header", title: "Friends" });
      friendsList.forEach((friend) => {
        result.push({ type: "friend", data: friend });
      });
    }

    // Add contacts section if there are contacts
    if (visibleContacts.length > 0) {
      result.push({
        type: "header",
        title: "Post for Anyone",
        isContact: true,
      });
      visibleContacts.forEach((contact) => {
        result.push({ type: "contact", data: contact });
      });
    }

    return result;
  }, [friendsList, visibleContacts]);

  const searchableItems = items.filter(
    (item): item is Extract<ListItem, { type: "friend" | "contact" }> =>
      item.type === "friend" || item.type === "contact",
  );

  const filterItems = useCallback(
    (query: string) => {
      return searchableItems.filter((item) => {
        const searchTerm = query.toLowerCase();
        if (item.type === "friend") {
          return (
            item.data.username.toLowerCase().includes(searchTerm) ||
            item.data.name.toLowerCase().includes(searchTerm)
          );
        } else if (item.type === "contact") {
          return (
            item.data.name?.toLowerCase().includes(searchTerm) ||
            item.data.phoneNumbers?.[0]?.number
              ?.toLowerCase()
              .includes(searchTerm)
          );
        }
        return false;
      });
    },
    [searchableItems],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const filteredItems = useMemo(
    () => (searchQuery ? filterItems(searchQuery) : searchableItems),
    [searchQuery, filterItems, searchableItems],
  );

  const displayItems = useMemo(() => {
    const result: ListItem[] = [];
    const friends = filteredItems.filter(
      (item): item is Extract<ListItem, { type: "friend" }> =>
        item.type === "friend",
    );
    const contacts = filteredItems.filter(
      (item): item is Extract<ListItem, { type: "contact" }> =>
        item.type === "contact",
    );

    if (friends.length > 0) {
      result.push({ type: "header", title: "Friends" });
      result.push(...friends);
    }

    if (contacts.length > 0) {
      result.push({
        type: "header",
        title: "Post for Anyone",
        isContact: true,
      });
      result.push(...contacts);
    }

    return result;
  }, [filteredItems]);

  const loadContacts = useCallback(async () => {
    const contactsNotOnApp = await getDeviceContactsNotOnApp();
    setContacts(contactsNotOnApp);
    setVisibleContacts(contactsNotOnApp.slice(0, INITIAL_PAGE_SIZE));
    setIsLoadingContacts(false);
  }, [getDeviceContactsNotOnApp]);

  const loadMoreContacts = useCallback(() => {
    if (visibleContacts.length >= contacts.length) return;

    const nextPage = contactsPage + 1;
    const newVisibleContacts = contacts.slice(
      0,
      INITIAL_PAGE_SIZE + nextPage * ADDITIONAL_PAGE_SIZE,
    );
    setVisibleContacts(newVisibleContacts);
    setContactsPage(nextPage);
  }, [contacts, visibleContacts.length, contactsPage]);

  useEffect(() => {
    void loadContacts();
  }, []);

  useEffect(() => {
    if (__DEV__) storage.set(HAS_SEEN_SHARE_TIP_KEY, false);
    const hasSeenTip = storage.getBoolean(HAS_SEEN_SHARE_TIP_KEY);

    if (!hasSeenTip) {
      // Show the fun popup after a short delay to let the screen mount smoothly
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
  }, [infoDialog]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadContacts(), refetch()]);
    setRefreshing(false);
  }, [loadContacts, refetch]);

  const handleOnEndReached = useCallback(async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
    loadMoreContacts();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage, loadMoreContacts]);

  const onContactSelected = useCallback(
    (contact: Contact) => {
      router.navigate({
        pathname: "/create-post",
        params: {
          uri,
          type,
          width,
          height,
          number: contact.phoneNumbers?.[0]?.number ?? "",
          userType: "notOnApp",
          recipientName: contact.name ?? "",
          recipientImage: contact.imageAvailable
            ? contact.image?.uri
            : undefined,
        },
      });
    },
    [router, uri, type, width, height],
  );

  const onFriendSelected = useCallback(
    (friend: Friend) => {
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
    },
    [router, uri, type, width, height],
  );

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "header") {
        return (
          <XStack alignItems="center" gap="$2">
            <H5 theme="alt1">{item.title}</H5>
            {item.isContact && (
              <TouchableOpacity
                onPress={() => {
                  void infoDialog.show({
                    title: "Post for Anyone",
                    subtitle:
                      "You can share posts with friends who aren't on Oppfy yet! They'll get a text invite to join and see your post when they do. It's a great way to bring your friends into the fun.",
                    acceptText: "Got it",
                  });
                }}
              >
                <Info size="$1" color="$blue9" />
              </TouchableOpacity>
            )}
          </XStack>
        );
      }

      if (item.type === "friend") {
        return (
          <MediaListItem
            title={item.data.username}
            subtitle={item.data.name}
            imageUrl={
              item.data.profilePictureUrl
                ? { uri: item.data.profilePictureUrl }
                : DefaultProfilePicture
            }
            primaryAction={{
              label: "Select",
              iconAfter: ChevronRight,
              onPress: () => onFriendSelected(item.data),
            }}
            onPress={() => onFriendSelected(item.data)}
          />
        );
      }

      return (
        <MediaListItem
          title={item.data.name}
          subtitle={formatPhoneNumber(item.data.phoneNumbers?.[0]?.number)}
          imageUrl={
            item.data.imageAvailable
              ? { uri: item.data.image?.uri }
              : DefaultProfilePicture
          }
          primaryAction={{
            label: "Select",
            icon: ChevronRight,
            onPress: () => onContactSelected(item.data),
          }}
        />
      );
    },
    [formatPhoneNumber, onContactSelected, onFriendSelected, infoDialog],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <YStack gap="$4">
        <SearchInput
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />
      </YStack>
    ),
    [searchQuery, setSearchQuery],
  );

  const ListEmptyComponent = useCallback(() => {
    const isLoading = isLoadingFriends || isLoadingContacts;

    if (isLoading) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaListItemSkeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (items.length === 0) {
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

    if (filteredItems.length === 0) {
      return (
        <YStack flex={1}>
          <H6 theme="alt1">No Users Found</H6>
        </YStack>
      );
    }

    return null;
  }, [isLoadingFriends, isLoadingContacts, items.length, filteredItems.length]);

  const getItemType = useCallback((item: ListItem) => {
    return item.type;
  }, []);

  const keyExtractor = useCallback((item: ListItem) => {
    switch (item.type) {
      case "header":
        return `header-${item.title}`;
      case "friend":
        return `friend-${item.data.userId}`;
      case "contact":
        return `contact-${item.data.id ?? item.data.phoneNumbers?.[0]?.number ?? Math.random()}`;
    }
  }, []);

  return (
    <FlashList
      data={displayItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={75}
      getItemType={getItemType}
      ItemSeparatorComponent={Spacer}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponentStyle={{ marginBottom: getToken("$4", "space") }}
      contentContainerStyle={{
        padding: getToken("$4", "space"),
        paddingBottom: insets.bottom + getToken("$2", "space"),
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
