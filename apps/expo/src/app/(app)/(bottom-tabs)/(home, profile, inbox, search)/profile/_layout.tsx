import { useLocalSearchParams } from "expo-router";

import { Stack } from "~/layouts";

const ProfileLayout = () => {
  const { userId, username } = useLocalSearchParams<{
    userId: string;
    username: string;
  }>();

  return (
    <Stack>
      <Stack.Screen
        name="[userId]"
        options={{
          title: username,
        }}
      />
      <Stack.Screen name="connections" />
    </Stack>
  );
};

export default ProfileLayout;
