import React, { useEffect, useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { UserRoundX } from "@tamagui/lucide-icons";
import { Skeleton } from "moti/skeleton";
import {
  Avatar,
  Button,
  ButtonProps,
  ListItem,
  SizableText,
  View,
  XStack,
  YStack,
} from "tamagui";

import { EmptyPlaceholder } from "~/components/UIPlaceholders";
import { BaseScreenView } from "~/components/Views";
import { api } from "~/utils/api";

const Followers = () => {
  const {
    data: followersData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = api.user.getCurrentUserFollowers.useInfiniteQuery(
    {
      pageSize: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const placeholderData = useMemo(() => {
    return Array.from({ length: 10 }, () => null);
  }, []);

  const friendsItems = useMemo(() => {
    return followersData?.pages.flatMap((page) => page.items);
  }, [followersData]);

  const itemCount = useMemo(() => {
    if (followersData === undefined) return 0;

    return followersData.pages.reduce(
      (total, page) => total + page.items.length,
      0,
    );
  }, [followersData]);

  const handleOnEndReached = async () => {
    if (!isFetchingNextPage && hasNextPage) {
      await fetchNextPage();
    }
  };

  const [unfollowed, setUnfollowed] = useState<Record<string, boolean>>({});

  const toggleUnfollow = (id: string) => {
    setUnfollowed((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <BaseScreenView paddingBottom={0}>
      {isLoading || itemCount ? (
        <FlashList
          extraData={unfollowed}
          data={isLoading ? placeholderData : friendsItems}
          estimatedItemSize={75}
          onEndReached={handleOnEndReached}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <SizableText size="$2" theme="alt1" marginBottom="$2">
              FOLLOWERS
            </SizableText>
          }
          renderItem={({ item, index }) => {
            const isFirstInGroup = index === 0;
            const isLastInGroup = index === itemCount - 1;

            return (
              <View>
                {item === null ? (
                  <VirtualizedListItem
                    loading
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                  />
                ) : (
                  <VirtualizedListItem
                    loading={false}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    // ! ignore typeerrors, we'll be null checking on the backend soon
                    title={item.username}
                    subtitle={item.name}
                    imageUrl={item.profilePictureUrl}
                    buttons={[
                      {
                        title: unfollowed[item.userId] ? "Follow" : "Unfollow",
                        onPress: () => toggleUnfollow(item.userId),
                      },
                    ]}
                  />
                )}
              </View>
            );
          }}
        />
      ) : (
        <View
          flex={1}
          justifyContent="center"
          // bottom={headerHeight}
        >
          <EmptyPlaceholder
            title="Blocked Users"
            subtitle="If you block someone, you'll be able to manage them here."
            icon={<UserRoundX />}
          />
        </View>
      )}
    </BaseScreenView>
  );
};

type Icon = JSX.Element;

interface BaseProps {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

interface LoadingProps extends BaseProps {
  loading: true;
}

interface LoadedProps extends BaseProps {
  loading: false;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  subtitle2?: string;
  buttons?: {
    title: string;
    onPress?: () => void;
    icon?: Icon;
    iconAfter?: Icon;
  }[];
}

type VirtualizedListItemProps = LoadingProps | LoadedProps;

const VirtualizedListItem = (props: VirtualizedListItemProps) => (
  <Skeleton.Group show={props.loading}>
    <ListItem
      size="$4.5"
      hoverTheme={false}
      pressTheme={false}
      padding={12}
      borderColor="$gray4"
      borderWidth={1}
      borderBottomWidth={0}
      {...(props.isFirstInGroup && {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      })}
      {...(props.isLastInGroup && {
        borderBottomWidth: 1,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
      })}
    >
      <XStack flex={1} alignItems="center">
        <XStack flex={1} alignItems="center" gap="$2">
          {!props.loading && props.imageUrl && (
            <Skeleton radius={100}>
              <Avatar circular size="$5">
                <Avatar.Image src={props.imageUrl} />
              </Avatar>
            </Skeleton>
          )}

          <YStack>
            {!props.loading && props.title && (
              <Skeleton>
                <SizableText>{props.title}</SizableText>
              </Skeleton>
            )}

            {!props.loading && props.subtitle && (
              <Skeleton>
                <SizableText>{props.subtitle}</SizableText>
              </Skeleton>
            )}

            {!props.loading && props.subtitle2 && (
              <Skeleton>
                <SizableText>{props.subtitle2}</SizableText>
              </Skeleton>
            )}
          </YStack>
        </XStack>

        <XStack gap="$2">
          {!props.loading &&
            props.buttons?.map((button, index) => (
              <Skeleton key={index}>
                <Button {...button}>{button.title}</Button>
              </Skeleton>
            ))}
        </XStack>
      </XStack>
    </ListItem>
  </Skeleton.Group>
);

export default Followers;
