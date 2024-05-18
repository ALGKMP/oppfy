import { useTheme } from "tamagui";

import { Stack } from "~/layouts";

const SearchLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        // header: () => null,
        contentStyle: {
          backgroundColor: theme.background.val,
        },
      }}
    />
  );
};

export default SearchLayout;
