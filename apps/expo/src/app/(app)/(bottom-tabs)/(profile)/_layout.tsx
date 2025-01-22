import { Stack } from "~/components/Layouts/Navigation";

const ProfileLayout = () => {
  return (
    <Stack
      initialRouteName="self-profile"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="self-profile"
        options={{
          headerShown: false,
        }}
        initialParams={{ isFirstInStack: "yes" }}
      />
    </Stack>
  );
};

export default ProfileLayout;
