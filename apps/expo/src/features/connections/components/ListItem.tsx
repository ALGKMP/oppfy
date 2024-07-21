import React from "react";
import { useRouter, useSegments } from "expo-router";
import { Send, UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import type { ButtonProps } from "~/components/ListItems/VirtualizedListItem";
import type { UserItem } from "../types";

interface ListItemProps {
  item: UserItem;
  handleFollow: (userId: string) => Promise<void>;
  handleUnfollow: (userId: string) => Promise<void>;
  handleCancelFollowRequest: (userId: string) => Promise<void>;
}

const ListItem = ({
  item,
  handleFollow,
  handleUnfollow,
  handleCancelFollowRequest,
}: ListItemProps) => {
  const router = useRouter();
  const segments = useSegments();

  const renderButton = (item: UserItem): ButtonProps => {
    switch (item.relationshipState) {
      case "followRequestSent":
        return {
          text: "Sent",
          icon: Send,
          onPress: () => void handleCancelFollowRequest(item.userId),
        };
      case "following":
        return {
          text: "Unfollow",
          icon: UserRoundMinus,
          onPress: () => void handleUnfollow(item.userId),
        };
      case "notFollowing":
        return {
          text: "Follow",
          icon: UserRoundPlus,
          theme: "blue",
          onPress: () => void handleFollow(item.userId),
        };
    }
  };

  return (
    <View>
      <VirtualizedListItem
        loading={false}
        title={item.username}
        subtitle={item.name}
        imageUrl={item.profilePictureUrl}
        button={renderButton(item)}
        onPress={() =>
          router.push({
            pathname: `/${segments[2]}/profile/[profileId]`,
            params: { profileId: String(item.profileId) },
          })
        }
      />
    </View>
  );
};

export default ListItem;
