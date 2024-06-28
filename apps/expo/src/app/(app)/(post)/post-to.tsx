import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import * as Contacts from "expo-contacts";
import type { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import {
  ArrowBigLeft,
  ChevronRight,
  Minus,
  UserRoundX,
} from "@tamagui/lucide-icons";
import {
  Button,
  H6,
  ListItemTitle,
  ScrollView,
  Separator,
  Spacer,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import CardContainer from "~/components/Containers/CardContainer";
import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const INITIAL_PAGE_SIZE = 5;
const ADDITIONAL_PAGE_SIZE = 10;

const PostTo = () => {
  const { type, uri, height, width } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
    height: string;
    width: string;
  }>();

  const theme = useTheme();

  const router = useRouter();
  const headerHeight = useHeaderHeight();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [visibleContacts, setVisibleContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [contactsPage, setContactsPage] = useState(0);

  useEffect(() => {
    const loadContacts = async () => {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.Image,
          Contacts.Fields.PhoneNumbers,
        ],
      });
      setContacts(data);
      setVisibleContacts(data.slice(0, INITIAL_PAGE_SIZE));
      setIsLoadingContacts(false);
    };

    void loadContacts();
  }, []);

  const {
    data: friendsData,
    isLoading: isLoadingFriends,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.friend.paginateFriendsSelf.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const friendItems = useMemo(
    () => friendsData?.pages.flatMap((page) => page.items) ?? [],
    [friendsData],
  );
  const itemCount = useMemo(
    () =>
      friendsData?.pages.reduce(
        (total, page) => total + page.items.length,
        0,
      ) ?? 0,
    [friendsData],
  );

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const onUserSelected = (recipientId: string) => {
    router.navigate({
      pathname: "/create-post",
      params: {
        uri,
        type,
        width,
        height,
        recipientId,
      },
    });
  };

  const showMoreContacts = () => {
    const nextPage = contactsPage + 1;
    const newVisibleContacts = contacts.slice(
      0,
      INITIAL_PAGE_SIZE + nextPage * ADDITIONAL_PAGE_SIZE,
    );
    setVisibleContacts(newVisibleContacts);
    setContactsPage(nextPage);
  };

  const isLoading = isLoadingFriends || isLoadingContacts;

  const renderLoadingSkeletons = () => {
    <BaseScreenView scrollable>
      <CardContainer>
        {PLACEHOLDER_DATA.map((_, index) => (
          <VirtualizedListItem
            key={index}
            loading
            showSkeletons={{
              imageUrl: true,
              title: true,
              subtitle: true,
            }}
          />
        ))}
      </CardContainer>
    </BaseScreenView>;
  };

  const renderContacts = () => (
    <CardContainer>
      <H6>Contacts</H6>

      {visibleContacts.map((contact, index) => (
        <VirtualizedListItem
          key={index}
          loading={false}
          title={contact.name}
          subtitle={contact.phoneNumbers?.[0]?.number}
          button={<ChevronRight size={24} color="$gray10" />}
          imageUrl={
            contact.imageAvailable ? contact.image?.uri : DefaultProfilePicture
          }
          // onPress={() => onUserSelected(contact.id)}
        />
      ))}

      {visibleContacts.length < contacts.length && (
        <>
          <Spacer size="$2" />
          <Button
            onPress={showMoreContacts}
            disabled={visibleContacts.length >= contacts.length}
          >
            Show more
          </Button>
        </>
      )}
    </CardContainer>
  );

  const renderFriends = () => (
    <CardContainer>
      <H6>Friends</H6>

      <FlashList
        data={friendItems}
        ItemSeparatorComponent={Separator}
        estimatedItemSize={75}
        onEndReached={handleOnEndReached}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <VirtualizedListItem
            loading={false}
            title={item.username}
            subtitle={item.name}
            imageUrl={item.profilePictureUrl}
            button={<ChevronRight size={24} color="$gray10" />}
            onPress={() => onUserSelected(item.userId)}
          />
        )}
      />
    </CardContainer>
  );

  const renderUsersToPostTo = () => (
    <BaseScreenView
      flex={1}
      scrollable
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
      bottomSafeAreaStyle={{
        backgroundColor: theme.gray2.val,
      }}
    >
      <ScrollView>
        <YStack flex={1} gap="$4">
          {contacts.length > 0 && renderContacts()}
          {itemCount > 0 && renderFriends()}
        </YStack>
      </ScrollView>
    </BaseScreenView>
  );

  const renderNoResults = () => (
    <BaseScreenView>
      <View flex={1} justifyContent="center" bottom={headerHeight}>
        <EmptyPlaceholder
          title="Nowhere to post"
          subtitle="No friends yet, once you’ve added someone they’ll show up here."
          icon={<UserRoundX />}
        />
      </View>
    </BaseScreenView>
  );

  if (isLoading) {
    return renderLoadingSkeletons();
  }

  if (itemCount === 0 && contacts.length === 0) {
    return renderNoResults();
  }

  return renderUsersToPostTo();
};

export default PostTo;
