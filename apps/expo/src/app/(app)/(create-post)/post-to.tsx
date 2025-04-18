import React, { useEffect, useState } from "react";
import { Keyboard, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default_profile_picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, UserRoundX } from "@tamagui/lucide-icons";
import type { IFuseOptions } from "fuse.js";
import type { CountryCode } from "libphonenumber-js";
import { parsePhoneNumberWithError } from "libphonenumber-js";
import { debounce } from "lodash";
import { getToken, useTheme } from "tamagui";

import {
  EmptyPlaceholder,
  HeaderTitle,
  MediaListItem,
  SearchInput,
  Spacer,
  useDialogController,
  XStack,
  YStack,
} from "~/components/ui";
import { useContacts } from "~/hooks/contacts";
import useSearch from "~/hooks/useSearch";
import { api } from "~/utils/api";
import { storage } from "~/utils/storage";

interface Friend {
  userId: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
}

type ListItem =
  | { type: "header"; title: string; isContact?: boolean }
  | { type: "friend"; data: Friend }
  | { type: "contact"; data: Contact };

const HAS_SEEN_SHARE_TIP_KEY = "has_seen_share_tip";

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
        title: "Post for Anyone",
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

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "header") {
      return (
        <XStack alignItems="center" gap="$1">
          <HeaderTitle
            iconSize={18}
            iconColor={theme.primary.val as string}
            iconAfter={item.isContact ? "information-circle" : undefined}
            onPress={() =>
              void infoDialog.show({
                title: "Post for Anyone",
                subtitle:
                  "You can share posts with friends who aren't on Oppfy yet! They'll get a text invite to join and see your post when they do. It's a great way to bring your friends into the fun.",
                acceptText: "Got it",
              })
            }
          >
            {item.title}
          </HeaderTitle>
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
        subtitle={formatPhoneNumber(
          item.data.phoneNumbers?.[0]?.number,
          item.data.phoneNumbers?.[0]?.countryCode,
        )}
        imageUrl={
          item.data.imageAvailable
            ? { uri: item.data.image?.uri }
            : DefaultProfilePicture
        }
        primaryAction={{
          label: "Select",
          iconAfter: ChevronRight,
          onPress: () => onContactSelected(item.data),
        }}
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
