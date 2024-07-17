import { Slot, Stack } from "expo-router";

const ProfileLayout = () => {
  return (
    <Slot />
    // <Stack
    //   screenOptions={{
    //     header: () => null,
    //   }}
    // >
    //   {/* <Stack.Screen
    //   name="[profile-id]"
    //   options={{
    //     headerShown: false,
    //     // header: () => null,
    //     // headerRight: () => (
    //     //   <View>
    //     //     <Pressable onPress={() => console.log("THING CLICKED")}>
    //     //       {({ pressed }) => (
    //     //         <MoreHorizontal style={{ opacity: pressed ? 0.5 : 1 }} />
    //     //       )}
    //     //     </Pressable>
    //     //   </View>
    //   }}
    //   /> */}

    // </Stack>
  );
};

export default ProfileLayout;
