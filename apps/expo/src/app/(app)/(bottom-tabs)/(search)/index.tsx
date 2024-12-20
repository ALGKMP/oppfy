import React, { useCallback, useMemo, useState } from "react";
import { Keyboard, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { FlashList } from "@shopify/flash-list";
import { Send, UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { getToken, H5, H6, YStack } from "tamagui";

import { SearchInput } from "~/components/Inputs";
import GridSuggestions from "~/components/SuggestedUsers/GridSuggestions";
import {
  MediaListItem,
  MediaListItemActionProps,
  MediaListItemSkeleton,
  useActionSheetController,
} from "~/components/ui";
import { Spacer } from "~/components/ui/Spacer";
import { useSession } from "~/contexts/SessionContext";
import useRouteProfile from "~/hooks/useRouteProfile";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

type SearchResultItem = RouterOutputs["search"]["profilesByUsername"][number];

const Search = () => {
  const insets = useSafeAreaInsets();
  const actionSheet = useActionSheetController();
  const { user } = useSession();
  const { routeProfile } = useRouteProfile();
  const utils = api.useUtils();

  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  const { data: recommendationsData, isLoading: isLoadingRecommendationsData } =
    api.contacts.getRecommendationProfilesSelf.useQuery();

  const followMutation = api.follow.followUser.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.getRecommendationProfilesSelf.cancel();

      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();
      if (!prevData) return;

      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        prevData.map((item) =>
          item.userId === newData.userId
            ? {
                ...item,
                relationshipState:
                  item.privacy === "private"
                    ? "followRequestSent"
                    : "following",
              }
            : item,
        ),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      // Refetch latest data since our optimistic update may be outdated
      void utils.contacts.getRecommendationProfilesSelf.invalidate();
    },
  });

  const unfollowMutation = api.follow.unfollowUser.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.getRecommendationProfilesSelf.cancel();

      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();
      if (!prevData) return;

      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        prevData.map((item) =>
          item.userId === newData.userId
            ? { ...item, relationshipState: "notFollowing" }
            : item,
        ),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      // Refetch latest data since our optimistic update may be outdated
      void utils.contacts.getRecommendationProfilesSelf.invalidate();
    },
  });

  const cancelFollowRequest = api.follow.cancelFollowRequest.useMutation({
    onMutate: async (newData) => {
      await utils.contacts.getRecommendationProfilesSelf.cancel();

      const prevData = utils.contacts.getRecommendationProfilesSelf.getData();
      if (!prevData) return;

      utils.contacts.getRecommendationProfilesSelf.setData(
        undefined,
        prevData.map((item) =>
          item.userId === newData.recipientId
            ? { ...item, relationshipState: "notFollowing" }
            : item,
        ),
      );

      return { prevData };
    },
    onError: (_err, _newData, ctx) => {
      if (ctx === undefined) return;
      // Refetch latest data since our optimistic update may be outdated
      void utils.contacts.getRecommendationProfilesSelf.invalidate();
    },
  });

  const { mutateAsync: searchProfilesByUsername, isPending: isSearching } =
    api.search.profilesByUsername.useMutation();

  const handleFollow = useCallback(
    async (userId: string) => {
      await followMutation.mutateAsync({ userId });
    },
    [followMutation],
  );

  const handleUnfollow = useCallback(
    async (userId: string) => {
      await unfollowMutation.mutateAsync({ userId });
    },
    [unfollowMutation],
  );

  const handleCancelFollowRequest = useCallback(
    async (userId: string) => {
      await cancelFollowRequest.mutateAsync({ recipientId: userId });
    },
    [cancelFollowRequest],
  );

  const performSearch = useCallback(
    async (username: string) => {
      setSearchTerm(username);

      if (!username) {
        setSearchResults([]);
        return;
      }

      const results = await searchProfilesByUsername({ username });
      setSearchResults(results);
    },
    [searchProfilesByUsername],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (searchTerm) {
      await performSearch(searchTerm);
    }
    setRefreshing(false);
  }, [searchTerm, performSearch]);

  const renderListItem = useCallback(
    (item: SearchResultItem) => (
      <MediaListItem
        title={item.username}
        subtitle={item.name}
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        onPress={() =>
          routeProfile({ userId: item.userId, username: item.username })
        }
      />
    ),
    [routeProfile],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <YStack gap="$4" pb="$4">
        <SearchInput
          value={searchTerm}
          placeholder="Search by username"
          onChangeText={performSearch}
          onClear={() => {
            setSearchTerm("");
            setSearchResults([]);
          }}
        />

        {!searchTerm && (
          <GridSuggestions
            data={recommendationsData}
            isLoading={isLoadingRecommendationsData}
            onFollow={handleFollow}
            onProfilePress={(userId, username) =>
              routeProfile({ userId, username })
            }
          />
        )}
      </YStack>
    ),
    [
      searchTerm,
      isLoadingRecommendationsData,
      recommendationsData,
      renderListItem,
      performSearch,
    ],
  );

  const ListEmptyComponent = useCallback(() => {
    if (isSearching) {
      return (
        <YStack gap="$4">
          {Array.from({ length: 10 }).map((_, index) => (
            <MediaListItemSkeleton key={index} />
          ))}
        </YStack>
      );
    }

    if (searchTerm && !searchResults.length) {
      return (
        <YStack flex={1}>
          <H6 theme="alt1">No Users Found</H6>
        </YStack>
      );
    }

    return null;
  }, [isSearching, searchTerm, searchResults.length]);

  return (
    <FlashList
      data={searchTerm ? searchResults : []}
      renderItem={({ item }) => renderListItem(item)}
      estimatedItemSize={75}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={Spacer}
      contentContainerStyle={{
        padding: getToken("$4", "space"),
        paddingBottom: insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={Keyboard.dismiss}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default Search;
