import { Stack } from "expo-router";
import { useTheme } from "tamagui";

const HomeLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        // header: () => null,
        headerShown: false,
        contentStyle: { backgroundColor: theme.background.val },
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          title: "home",
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.background.val, // Use the theme background color
          },
          headerShadowVisible: false,
          headerTitleStyle: {
            color: theme.color.val, // Use the theme text color
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: theme.background.val,
          },
        }}
      />
      <Stack.Screen name="post/[postId]" options={{ header: () => null }} />
    </Stack>
  );
};

export default HomeLayout;
