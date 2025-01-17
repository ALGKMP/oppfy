import { Stack } from "~/components/Layouts/Navigation";

const HomeLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="index" />
    <Stack.Screen name="post/[postId]" />

    <Stack.Screen name="profile" options={{ headerShown: false }} />
    <Stack.Screen name="self-profile" options={{ headerShown: false }} />
  </Stack>
);

export default HomeLayout;
