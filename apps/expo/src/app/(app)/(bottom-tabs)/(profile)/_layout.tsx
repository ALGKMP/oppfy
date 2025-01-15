import { Stack } from "~/layouts";

const ProfileLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="self-profile" />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ProfileLayout;
