import { Stack } from "~/layouts";

const HomeLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="index" />
    <Stack.Screen name="post/[postId]" />
  </Stack>
);

export default HomeLayout;
