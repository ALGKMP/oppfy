import { Stack } from "~/components/Layouts/Navigation";

const LockedLayout = () => {
  return (
    <Stack
      screenOptions={{
        header: () => null,
      }}
    >
      <Stack.Screen name="select-contact" />
      <Stack.Screen name="select-photo" />
      <Stack.Screen name="post-to" />
      <Stack.Screen name="successfully-posted" /> {/* confetti animation with photo */}
    </Stack>
  );
};

export default LockedLayout;
