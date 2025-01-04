import { Stack } from "expo-router";
import { useTheme } from "tamagui";

const RecommendationsLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default RecommendationsLayout;
