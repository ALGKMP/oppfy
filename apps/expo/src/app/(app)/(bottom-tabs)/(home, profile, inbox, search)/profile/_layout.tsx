import { Stack } from "~/layouts";

const ProfileLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="[userId]" />
    <Stack.Screen name="connections" />
  </Stack>
);

export default ProfileLayout;
