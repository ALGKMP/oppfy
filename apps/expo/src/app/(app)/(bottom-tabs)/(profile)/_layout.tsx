import { Stack } from "~/components/Layouts/Navigation";

const ProfileLayout = () => {
  return (
    <Stack
      initialRouteName="self-profile"
      screenOptions={{
        headerShown: false,
      }}
    ></Stack>
  );
};

export default ProfileLayout;
