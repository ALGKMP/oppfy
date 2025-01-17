import { Stack } from "~/components/Layouts/Navigation";

const ProfileLayout = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="[userId]" />
  </Stack>
);

export default ProfileLayout;
