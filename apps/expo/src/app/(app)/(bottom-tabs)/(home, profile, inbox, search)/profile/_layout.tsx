import { Stack } from "~/layouts";

const ProfileLayout = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="[userId]" />
  </Stack>
);

export default ProfileLayout;
