import { useEffect } from "react";
import { Link, useGlobalSearchParams, useLocalSearchParams } from "expo-router";
import { Text, View } from "tamagui";

const Route = () => {
  const { username } = useLocalSearchParams<{
    username: string;
  }>();

  useEffect(() => {
    console.log("ONE", username);
  }, [username]);

  return (
    <View>
      <Text>{username}</Text>
      {/* <Text>User: {local.user}</Text>
      {friends.map((friend) => (
        <Link key={friend} href={`/${friend}`}>
          Visit {friend}
        </Link>
      ))} */}
    </View>
  );
};

export default Route;
