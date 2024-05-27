import { Stack } from "~/layouts";
import { useTheme } from "tamagui";

const MediaOfFriendsLayout = () => {
  const theme = useTheme();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => null,
        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          header: () => null,
        }}
      />
    </Stack>
  );
};

export default MediaOfFriendsLayout;
