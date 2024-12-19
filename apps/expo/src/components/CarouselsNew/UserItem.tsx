import { TouchableOpacity } from "react-native";

import { Text, XStack, YStack } from "~/components/ui";
import useRouteProfile from "~/hooks/useRouteProfile";
import Avatar from "../Avatar";

export interface UserItemShortCard {
  userId: string;
  username: string;
  profilePictureUrl: string | null;
}

interface UserItemProps extends UserItemShortCard {}

const UserItem = ({ item }: { item: UserItemProps }) => {
  const { routeProfile } = useRouteProfile();

  return (
    <TouchableOpacity onPress={() => routeProfile({ userId: item.userId, username: item.username })}>
      <YStack width={70} gap="$2" alignItems="center">
        <Avatar
          source={item.profilePictureUrl}
          size={70}
          recyclingKey={item.userId}
        />
        <Text
          fontSize="$2"
          fontWeight="600"
          textAlign="center"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.username}
        </Text>
      </YStack>
    </TouchableOpacity>
  );
};

export default UserItem;
