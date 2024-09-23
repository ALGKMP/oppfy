import React from "react";
import { useRouter } from "expo-router";
import DefaultProfilePicture from "@assets/default-profile-picture.jpg";
import { Send, UserRoundMinus, UserRoundPlus } from "@tamagui/lucide-icons";
import { View } from "tamagui";

import { VirtualizedListItem } from "~/components/ListItems";
import type { ButtonProps } from "~/components/ListItems/VirtualizedListItem";
import type { RouterOutputs } from "~/utils/api";

export type UserItem =
  RouterOutputs["follow"]["paginateFollowingOthers"]["items"][0];

interface ListItemProps {
  item: UserItem;
  handleFollow: (userId: string) => Promise<void>;
  handleUnfollow: (userId: string) => Promise<void>;
  handleCancelFollowRequest: (userId: string) => Promise<void>;
  hideButton?: boolean;
}

const ListItem = ({
  item,
  handleFollow,
  handleUnfollow,
  handleCancelFollowRequest,
  hideButton,
}: ListItemProps) => {
  const router = useRouter();

  const renderButton = (item: UserItem): ButtonProps | undefined => {
    if (hideButton) return undefined;

    switch (item.relationshipState) {
      case "followRequestSent":
        return {
          text: "Sent",
          icon: <Send size="$1" />,
          disabled: true,
          disabledStyle: {
            opacity: 0.5,
          },
          onPress: () => void handleCancelFollowRequest(item.userId),
        };
      case "following":
        return {
          text: "Followed",
          icon: <UserRoundMinus size="$1" />,
          disabled: true,
          disabledStyle: {
            opacity: 0.5,
          },
          onPress: () => void handleUnfollow(item.userId),
        };
      case "notFollowing":
        return {
          text: "Follow",
          icon: <UserRoundPlus size="$1" />,
          backgroundColor: "$primary",
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
        imageUrl={item.profilePictureUrl ?? DefaultProfilePicture}
        button={renderButton(item)}
        onPress={() =>
          router.push({
            pathname: `/profile/[userId]`,
            params: { userId: item.userId, username: item.username },
          })
        }
      />
    </View>
  );
};

export default ListItem;
