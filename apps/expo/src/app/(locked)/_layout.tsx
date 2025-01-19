import { Stack } from "~/components/Layouts/Navigation";

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
