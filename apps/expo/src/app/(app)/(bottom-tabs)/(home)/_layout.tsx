import { Stack } from "~/components/Layouts/Navigation";

const HomeLayout = () => (
  <Stack
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="index" />
    <Stack.Screen
      name="post/[postId]"
      // options={{ headerShown: true, title: "Post" }}
    />
  </Stack>
);

export default HomeLayout;
