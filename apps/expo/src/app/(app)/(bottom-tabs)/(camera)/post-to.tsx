import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import * as Contacts from "expo-contacts";
import { Contact } from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.png";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { ArrowBigLeft, UserRoundX } from "@tamagui/lucide-icons";
import {
  Button,
  ScrollView,
  Separator,
  SizableText,
  Spacer,
  useTheme,
  View,
  XStack,
  YStack,
} from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";
import { PLACEHOLDER_DATA } from "~/utils/placeholder-data";

const PAGE_SIZE = 5;

const PostTo = () => {
  const { uri, type } = useLocalSearchParams<{
    uri: string;
    type: "photo" | "video";
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
      setVisibleContacts(data.slice(0, PAGE_SIZE));
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
        recipientId,
      },
    });
  };

  const showMoreContacts = () => {
    const nextPage = contactsPage + 1;
    const newVisibleContacts = contacts.slice(0, (nextPage + 1) * PAGE_SIZE);
    setVisibleContacts(newVisibleContacts);
    setContactsPage(nextPage);
  };

  const isLoading = isLoadingFriends || isLoadingContacts;

  if (isLoading) {
    return (
      <BaseScreenView scrollable>
        <View
          paddingVertical="$2"
          paddingHorizontal="$3"
          borderRadius="$6"
          backgroundColor="$gray2"
        >
          <FlashList
            data={PLACEHOLDER_DATA}
            ItemSeparatorComponent={Separator}
            estimatedItemSize={75}
            showsVerticalScrollIndicator={false}
            renderItem={() => (
              <VirtualizedListItem
                loading
                showSkeletons={{
                  imageUrl: true,
                  title: true,
                  subtitle: true,
                }}
              />
            )}
          />
        </View>
      </BaseScreenView>
    );
  }

  if (itemCount === 0) {
    return (
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
  }

  return (
    <BaseScreenView
      paddingBottom={0}
      paddingHorizontal={0}
      safeAreaEdges={["bottom"]}
      bottomSafeAreaStyle={{
        backgroundColor: theme.gray2.val,
      }}
    >
      <ScrollView
        flex={1}
        paddingHorizontal="$4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isLoadingContacts}
            onRefresh={refetch}
          />
        }
      >
        <YStack flex={1} gap="$4">
          <View
            paddingVertical="$3"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
            <ListHeader title="Contacts" />

            {visibleContacts.map((contact, index) => (
              <VirtualizedListItem
                key={index}
                loading={false}
                title={contact.name}
                subtitle={contact.phoneNumbers?.[0]?.number}
                imageUrl={
                  contact.imageAvailable
                    ? contact.image?.uri
                    : DefaultProfilePicture
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
          </View>

          <View
            paddingVertical="$2"
            paddingHorizontal="$3"
            borderRadius="$6"
            backgroundColor="$gray2"
          >
            <FlashList
              data={friendItems}
              ItemSeparatorComponent={Separator}
              estimatedItemSize={75}
              onEndReached={handleOnEndReached}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={<ListHeader title="Friends" />}
              renderItem={({ item }) => (
                <VirtualizedListItem
                  loading={false}
                  title={item.username}
                  subtitle={item.name}
                  imageUrl={item.profilePictureUrl}
                  onPress={() => onUserSelected(item.userId)}
                />
              )}
            />
          </View>
        </YStack>
      </ScrollView>

      <XStack
        paddingTop="$4"
        paddingHorizontal="$4"
        justifyContent="space-evenly"
        backgroundColor={"$gray2"}
        borderTopLeftRadius={36}
        borderTopRightRadius={36}
        gap="$4"
      >
        <Button
          flex={2}
          size={"$5"}
          borderRadius="$8"
          icon={ArrowBigLeft}
          onPress={() => router.back()}
        >
          Back
        </Button>
      </XStack>
    </BaseScreenView>
  );
};

interface ListHeaderProps {
  title: string;
}

const ListHeader = ({ title }: ListHeaderProps) => (
  <SizableText size="$2" theme="alt1">
    {title}
  </SizableText>
);

export default PostTo;
