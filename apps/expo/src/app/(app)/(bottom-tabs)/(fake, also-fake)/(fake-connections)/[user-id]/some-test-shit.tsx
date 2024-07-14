import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "tamagui";

const Page = () => {
  const { userId } = useLocalSearchParams();
  useEffect(() => {
    console.log(userId);
  }, [userId]);

  return (
    <View>
      <Text>userId:</Text>
      <Text backgroundColor={"red"}>{userId}</Text>
    </View>
  );
};

export default Page;
