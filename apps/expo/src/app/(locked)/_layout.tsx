import { Stack } from "~/layouts";

const LockedLayout = () => {
  return (
    <Stack
      screenOptions={{
        header: () => null,
      }}
    >
      <Stack.Screen name="invite" />
    </Stack>
  );
};

export default LockedLayout;
