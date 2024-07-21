import { Stack } from "expo-router";
import { useTheme } from "tamagui";

const HomeLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        header: () => null,
        contentStyle: { backgroundColor: theme.background.val },
      }}
    >
      <Stack.Screen name="home" options={{ header: () => null }} />
      <Stack.Screen name="post/[postId]" options={{ header: () => null }} />
    </Stack>
  );
};

export default HomeLayout;
