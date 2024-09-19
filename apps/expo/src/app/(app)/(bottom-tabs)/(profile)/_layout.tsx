import { Stack } from "expo-router";

const ProfileLayout = () => {
  return (
    <Stack
      screenOptions={{
        header: () => null,
      }}
    >
      <Stack.Screen name="self-profile" />
    </Stack>
  );
};

export default ProfileLayout;
