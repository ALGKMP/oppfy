import { Stack } from "~/layouts";

const ProfileLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="self-profile" />
    </Stack>
  );
};

export default ProfileLayout;
