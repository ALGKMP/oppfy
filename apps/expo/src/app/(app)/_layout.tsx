import { Redirect } from "expo-router";
import { Text } from "tamagui";

import useSession from "~/hooks/useSession";
import { Stack } from "~/layouts";

const AppLayout = () => {
  const { isLoading, user } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  return <Stack />;
};

export default AppLayout;
